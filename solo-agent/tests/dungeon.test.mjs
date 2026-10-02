import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioCues } from '../src/audio.mjs';
import { dungeonSignature, generateDungeon, normalizeSeed } from '../src/dungeon.mjs';
import { DungeonGame } from '../src/game.mjs';
import { applyUpgrade, createFreshPlayer, damagePlayer, UPGRADE_DEFINITIONS } from '../src/rules.mjs';

test('seed input accepts the unsigned 32-bit range and rejects other forms', () => {
  assert.equal(normalizeSeed('0'), 0);
  assert.equal(normalizeSeed('4294967295'), 0xffffffff);
  assert.equal(normalizeSeed('4294967296'), null);
  assert.equal(normalizeSeed('-1'), null);
  assert.equal(normalizeSeed('4.2'), null);
  assert.equal(normalizeSeed(''), null);
});

test('the same seed reproduces the full route, encounters, and offers', () => {
  assert.equal(dungeonSignature(generateDungeon(1729)), dungeonSignature(generateDungeon(1729)));
});

test('generated route contains a start, three fights, a boss, and consecutive links', () => {
  const dungeon = generateDungeon(1729);
  assert.deepEqual(dungeon.rooms.map((room) => room.type), ['start', 'combat', 'combat', 'combat', 'boss']);
  assert.equal(dungeon.rooms.length, 5);
  for (let index = 0; index < dungeon.rooms.length; index += 1) {
    assert.equal(dungeon.rooms[index].index, index);
    assert.equal(dungeon.rooms[index].id, `room-${index + 1}`);
  }
  for (const room of dungeon.rooms.slice(1, -1)) assert.ok(room.encounter.length >= 2);
});

test('the route guarantees melee, ranged, and elite enemies', () => {
  const types = new Set(generateDungeon(83).rooms.flatMap((room) => room.encounter.map((enemy) => enemy.type)));
  assert.deepEqual(types, new Set(['melee', 'ranged', 'elite']));
});

test('every reward event has two choices and the run offers every distinct effect', () => {
  const dungeon = generateDungeon(65537);
  const events = dungeon.rooms.filter((room) => room.type === 'combat');
  assert.equal(events.length, 3);
  const offered = new Set();
  for (const room of events) {
    assert.equal(room.offers.length, 2);
    assert.notEqual(room.offers[0], room.offers[1]);
    room.offers.forEach((id) => offered.add(id));
  }
  assert.deepEqual(offered, new Set(Object.keys(UPGRADE_DEFINITIONS)));
});

test('two verification seeds differ in layout, encounters, and offered pairs', () => {
  const first = generateDungeon(17);
  const second = generateDungeon(42);
  assert.notDeepEqual(
    first.rooms.map((room) => room.layout.id),
    second.rooms.map((room) => room.layout.id),
  );
  assert.notDeepEqual(
    first.rooms.flatMap((room) => room.encounter.map((enemy) => enemy.type)),
    second.rooms.flatMap((room) => room.encounter.map((enemy) => enemy.type)),
  );
  assert.notDeepEqual(
    first.rooms.map((room) => room.offers),
    second.rooms.map((room) => room.offers),
  );
});

test('upgrade effects change stats and damage respects health and invulnerability bounds', () => {
  const base = createFreshPlayer();
  const stronger = applyUpgrade(base, 'damage');
  const faster = applyUpgrade(base, 'haste');
  const swifter = applyUpgrade(base, 'swift');
  const heartier = applyUpgrade({ ...base, health: 4 }, 'vitality');
  assert.equal(stronger.damage, base.damage + 1);
  assert.ok(faster.attackCooldown < base.attackCooldown);
  assert.ok(swifter.speed > base.speed);
  assert.equal(heartier.maxHealth, base.maxHealth + 2);
  assert.equal(heartier.health, 6);

  const hurt = damagePlayer({ ...base, health: 1 }, 8);
  assert.equal(hurt.player.health, 0);
  assert.equal(hurt.tookDamage, true);
  assert.equal(damagePlayer(hurt.player, 1).player.health, 0);
  assert.equal(damagePlayer({ ...base, invulnerability: 0.5 }, 1).tookDamage, false);
});

test('combat doors lock while enemies remain, then open after the room is cleared', () => {
  const game = new DungeonGame();
  game.startRun(9);
  assert.equal(game.isDoorOpen('right'), true);
  game.enterRoom(1);
  assert.equal(game.currentState.enemies.length > 0, true);
  assert.equal(game.isDoorOpen('left'), false);
  assert.equal(game.isDoorOpen('right'), false);
  game.currentState.enemies.forEach((enemy) => { enemy.dead = true; });
  game.checkRoomClear(game.currentState);
  assert.equal(game.currentState.cleared, true);
  assert.equal(game.mode, 'reward');
  assert.equal(game.isDoorOpen('left'), true);
  assert.equal(game.isDoorOpen('right'), true);
});

test('held movement crosses connected room gates only when they are open', () => {
  const game = new DungeonGame();
  game.startRun(17);
  game.setKey('d', true);
  for (let frame = 0; frame < 200 && game.roomIndex === 0; frame += 1) game.tick(0.04);
  game.setKey('d', false);
  assert.equal(game.roomIndex, 1);
  assert.equal(game.player.x, 104);

  game.currentState.enemies.forEach((enemy) => { enemy.dead = true; });
  game.checkRoomClear(game.currentState);
  game.chooseUpgrade(game.currentRoom.offers[0]);
  game.setKey('d', true);
  for (let frame = 0; frame < 200 && game.roomIndex === 1; frame += 1) game.tick(0.04);
  game.setKey('d', false);
  assert.equal(game.roomIndex, 2);
});

test('a selected upgrade applies, and a fresh run resets health and relics', () => {
  const game = new DungeonGame();
  game.startRun(1234);
  game.enterRoom(1);
  game.mode = 'reward';
  const selected = game.currentRoom.offers[0];
  assert.equal(game.chooseUpgrade(selected), true);
  assert.equal(game.player.upgrades[selected], 1);
  assert.equal(game.mode, 'playing');

  game.player.health = 1;
  game.startRun(5678);
  assert.equal(game.roomIndex, 0);
  assert.equal(game.player.health, 8);
  assert.equal(game.player.maxHealth, 8);
  assert.deepEqual(game.player.upgrades, {});
  assert.equal(game.currentRoom.type, 'start');
});

test('boss cycles through a charge and a radial projectile pattern', () => {
  const game = new DungeonGame();
  game.startRun(17);
  game.roomIndex = 4;
  game.ensureRoomInitialized();
  const boss = game.currentBoss;
  const observed = new Set();
  for (let frame = 0; frame < 220; frame += 1) {
    observed.add(`${boss.phase}:${boss.pattern}`);
    const before = game.projectiles.length;
    game.updateBoss(boss, 0.04);
    if (game.projectiles.length > before) observed.add('radial-projectiles');
  }
  assert.ok([...observed].some((value) => value.endsWith(':charge')));
  assert.ok([...observed].some((value) => value.endsWith(':radial')));
  assert.ok(observed.has('radial-projectiles'));
});

test('player damage can transition an active run to Game Over', () => {
  const game = new DungeonGame();
  game.startRun(88);
  game.player.health = 1;
  assert.equal(game.damagePlayer(1, game.player.x - 10, game.player.y), true);
  assert.equal(game.player.health, 0);
  assert.equal(game.mode, 'gameover');
});

test('held movement advances at a frame-rate-independent diagonal speed', () => {
  const horizontal = new DungeonGame();
  horizontal.startRun(321);
  const startX = horizontal.player.x;
  horizontal.setKey('d', true);
  for (let frame = 0; frame < 10; frame += 1) horizontal.tick(0.04);
  horizontal.setKey('d', false);
  const horizontalDistance = horizontal.player.x - startX;

  const diagonal = new DungeonGame();
  diagonal.startRun(321);
  const diagonalStartX = diagonal.player.x;
  const diagonalStartY = diagonal.player.y;
  diagonal.setKey('d', true);
  diagonal.setKey('w', true);
  for (let frame = 0; frame < 10; frame += 1) diagonal.tick(0.04);
  diagonal.setKey('d', false);
  diagonal.setKey('w', false);
  const diagonalDistance = Math.hypot(diagonal.player.x - diagonalStartX, diagonal.player.y - diagonalStartY);

  assert.ok(horizontalDistance > 75 && horizontalDistance < 100);
  assert.ok(Math.abs(horizontalDistance - diagonalDistance) < 1.5);
});

test('aimed attack damages only enemies inside the swing area', () => {
  const game = new DungeonGame();
  game.startRun(91);
  game.enterRoom(1);
  const [target, ...others] = game.currentState.enemies;
  target.x = game.player.x + 54;
  target.y = game.player.y;
  for (const enemy of others) {
    enemy.x = game.player.x - 120;
    enemy.y = game.player.y;
  }
  game.setAim(target.x + 20, target.y);
  const hp = target.health;
  assert.equal(game.tryAttack(), true);
  assert.equal(target.health, hp - game.player.damage);
  assert.equal(others.every((enemy) => enemy.health === enemy.maxHealth), true);
});

test('defeating the boss reaches Victory', () => {
  const game = new DungeonGame();
  game.startRun(91);
  game.roomIndex = 4;
  game.ensureRoomInitialized();
  const boss = game.currentBoss;
  boss.x = game.player.x + 50;
  boss.y = game.player.y;
  boss.health = 1;
  game.setAim(boss.x, boss.y);
  assert.equal(game.tryAttack(), true);
  assert.equal(game.mode, 'victory');
  assert.equal(boss.health, 0);
});

test('melee winds up before damaging and ranged and elite attacks show preparation states', () => {
  const game = new DungeonGame();
  game.startRun(17);
  game.enterRoom(1);
  const melee = game.currentState.enemies.find((enemy) => enemy.type === 'melee');
  const ranged = game.currentState.enemies.find((enemy) => enemy.type === 'ranged');
  melee.x = game.player.x + 42;
  melee.y = game.player.y;
  melee.cooldown = 0;
  melee.state = 'approach';
  const health = game.player.health;
  game.updateEnemies(game.currentState, 0.04);
  assert.equal(melee.state, 'windup');
  assert.equal(game.player.health, health);
  for (let frame = 0; frame < 13; frame += 1) game.updateEnemies(game.currentState, 0.04);
  assert.equal(game.player.health, health - 1);
  assert.ok(game.player.invulnerability > 0);

  assert.ok(ranged);
  ranged.x = game.player.x + 260;
  ranged.y = game.player.y;
  ranged.state = 'approach';
  ranged.cooldown = 0;
  game.updateEnemies(game.currentState, 0.04);
  assert.equal(ranged.state, 'aiming');

  game.enterRoom(1);
  game.enterRoom(1);
  const elite = game.currentState.enemies.find((enemy) => enemy.type === 'elite');
  assert.ok(elite);
  elite.x = game.player.x + 120;
  elite.y = game.player.y;
  elite.state = 'approach';
  elite.cooldown = 0;
  game.updateEnemies(game.currentState, 0.04);
  assert.equal(elite.state, 'chargeWindup');
});

test('ranged bolts travel toward the player and elite charges can hit across their lane', () => {
  const rangedGame = new DungeonGame();
  rangedGame.startRun(17);
  rangedGame.enterRoom(1);
  const ranged = rangedGame.currentState.enemies.find((enemy) => enemy.type === 'ranged');
  for (const enemy of rangedGame.currentState.enemies) {
    if (enemy !== ranged) enemy.dead = true;
  }
  ranged.x = rangedGame.player.x + 260;
  ranged.y = rangedGame.player.y;
  ranged.state = 'approach';
  ranged.cooldown = 0;
  rangedGame.updateEnemies(rangedGame.currentState, 0.04);
  assert.equal(ranged.state, 'aiming');
  for (let frame = 0; frame < 20; frame += 1) rangedGame.updateEnemies(rangedGame.currentState, 0.04);
  assert.equal(rangedGame.projectiles.length, 1);
  rangedGame.player.invulnerability = 0;
  const rangedHealth = rangedGame.player.health;
  for (let frame = 0; frame < 30; frame += 1) rangedGame.updateProjectiles(0.04);
  assert.equal(rangedGame.player.health, rangedHealth - 1);

  const eliteGame = new DungeonGame();
  eliteGame.startRun(17);
  eliteGame.enterRoom(1);
  eliteGame.enterRoom(1);
  eliteGame.enterRoom(1);
  const elite = eliteGame.currentState.enemies.find((enemy) => enemy.type === 'elite');
  for (const enemy of eliteGame.currentState.enemies) {
    if (enemy !== elite) enemy.dead = true;
  }
  eliteGame.player.invulnerability = 0;
  elite.x = eliteGame.player.x + 140;
  elite.y = eliteGame.player.y;
  elite.state = 'approach';
  elite.cooldown = 0;
  eliteGame.updateEnemies(eliteGame.currentState, 0.04);
  const eliteHealth = eliteGame.player.health;
  for (let frame = 0; frame < 30; frame += 1) eliteGame.updateEnemies(eliteGame.currentState, 0.04);
  assert.equal(eliteGame.player.health, eliteHealth - 2);
});

test('Web Audio cues produce distinct tones after user activation and respect mute', async () => {
  class FakeParam {
    setValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
  }
  class FakeNode {
    connect() {}
  }
  class FakeAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 1;
      this.destination = {};
      this.oscillators = [];
    }
    async resume() { this.state = 'running'; }
    createOscillator() {
      const oscillator = new FakeNode();
      oscillator.frequency = new FakeParam();
      oscillator.start = () => { oscillator.started = true; };
      oscillator.stop = () => { oscillator.stopped = true; };
      this.oscillators.push(oscillator);
      return oscillator;
    }
    createGain() {
      const gain = new FakeNode();
      gain.gain = new FakeParam();
      return gain;
    }
  }

  const original = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext;
  try {
    const audio = new AudioCues();
    await audio.unlock();
    audio.play('attack');
    audio.play('damage');
    assert.equal(audio.context.oscillators.length, 2);
    assert.notEqual(audio.context.oscillators[0].frequency.value, audio.context.oscillators[1].frequency.value);
    assert.equal(audio.context.oscillators.every((oscillator) => oscillator.started && oscillator.stopped), true);
    audio.setEnabled(false);
    audio.play('victory');
    assert.equal(audio.context.oscillators.length, 2);
  } finally {
    if (original === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = original;
  }
});
