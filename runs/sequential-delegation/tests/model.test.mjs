import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startRun, returnToMenu, updateGame, chooseReward, currentRoom, isRoomLocked, drainEvents, WORLD } from '../model.mjs';
import { damagePlayer, damageEnemy } from '../combat.mjs';
import { BASE_STATS, applyUpgrade } from '../upgrades.mjs';

function advance(game, seconds, input = {}, frame = 1 / 60) {
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += frame) updateGame(game, Math.min(frame, seconds - elapsed), input);
}

function clearRoom(game) {
  for (const enemy of currentRoom(game).runtime.enemies) damageEnemy(game, enemy, enemy.health);
  updateGame(game, 1 / 120);
}

test('menu rejects movement and combat until a run starts', () => {
  const game = createGame({ seed: 17 });
  assert.equal(game.phase, 'menu');
  advance(game, 1, { moveX: 1, attack: true });
  assert.equal(game.player.x, 92);
  assert.equal(game.time, 0);
  startRun(game);
  assert.equal(game.phase, 'playing');
  assert.equal(drainEvents(game)[0].type, 'run-started');
});

test('movement has equal axial and diagonal speed and ignores render-frame partitioning', () => {
  const axis = startRun(createGame());
  const diagonal = startRun(createGame());
  axis.player.x = diagonal.player.x = 250;
  axis.player.y = diagonal.player.y = 200;
  advance(axis, 0.8, { moveX: 1 }, 1 / 30);
  advance(diagonal, 0.8, { moveX: 1, moveY: 1 }, 1 / 144);
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - 250, diagonal.player.y - 200) - (axis.player.x - 250)) < 1e-7);
  const a = startRun(createGame());
  const b = startRun(createGame());
  advance(a, 1, { moveX: 1, aimX: 500, aimY: 300, attack: true }, 1 / 30);
  advance(b, 1, { moveX: 1, aimX: 500, aimY: 300, attack: true }, 1 / 144);
  assert.ok(Math.abs(a.player.x - b.player.x) < 1e-7);
  assert.equal(a.events.filter(event => event.type === 'player-attack').length, b.events.filter(event => event.type === 'player-attack').length);
  assert.equal(a.time, b.time);
});

test('doors are traversable only in their opening; both combat exits lock until cleared', () => {
  const game = startRun(createGame());
  game.player.x = WORLD.width - WORLD.wall - game.player.radius;
  game.player.y = 150;
  updateGame(game, 0.1, { moveX: 1 });
  assert.equal(game.roomIndex, 0);
  game.player.y = 300;
  updateGame(game, 1 / 120, { moveX: 1 });
  assert.equal(game.roomIndex, 1);
  assert.equal(isRoomLocked(game), true);
  game.player.x = WORLD.width - WORLD.wall - game.player.radius;
  updateGame(game, 0.1, { moveX: 1 });
  assert.equal(game.roomIndex, 1);
  game.player.x = WORLD.wall + game.player.radius;
  updateGame(game, 0.1, { moveX: -1 });
  assert.equal(game.roomIndex, 1);
  assert.ok(game.events.some(event => event.type === 'door-blocked'));
  clearRoom(game);
  assert.equal(isRoomLocked(game), false);
  assert.equal(game.rooms[1].cleared, true);
  assert.equal(game.pendingReward.offers.length, 2);
  const x = game.player.x;
  advance(game, 1, { moveX: 1, attack: true });
  assert.equal(game.player.x, x, 'reward selection pauses simulation');
  assert.equal(chooseReward(game, 'not-offered'), false);
  assert.equal(chooseReward(game, game.pendingReward.offers[0]), true);
  game.player.x = WORLD.width - WORLD.wall - game.player.radius;
  updateGame(game, 1 / 120, { moveX: 1 });
  assert.equal(game.roomIndex, 2);
  assert.equal(game.player.upgrades.length, 1);
});

test('each upgrade has a material distinct effect and survival health remains bounded', () => {
  const game = startRun(createGame());
  game.player.health = 60;
  applyUpgrade(game.player, 'damage');
  assert.equal(game.player.damage, BASE_STATS.damage + 8);
  applyUpgrade(game.player, 'cadence');
  assert.equal(game.player.attackCooldown, BASE_STATS.attackCooldown * 0.75);
  applyUpgrade(game.player, 'movement');
  assert.equal(game.player.speed, BASE_STATS.speed * 1.18);
  applyUpgrade(game.player, 'survival');
  assert.equal(game.player.maxHealth, 125);
  assert.equal(game.player.health, 85);
  assert.deepEqual(game.player.upgrades, ['damage', 'cadence', 'movement', 'survival']);
  game.player.health = 125;
  applyUpgrade(game.player, 'survival');
  assert.equal(game.player.health, 150);
  for (let i = 0; i < 20; i++) applyUpgrade(game.player, 'cadence');
  assert.equal(game.player.attackCooldown, 0.16);
});

test('player damage grants temporary invulnerability; zero health enters game over once', () => {
  const game = startRun(createGame());
  assert.equal(damagePlayer(game, 20, 'test'), true);
  assert.equal(game.player.health, 80);
  assert.equal(damagePlayer(game, 20), false);
  assert.equal(game.player.health, 80);
  advance(game, 0.9);
  assert.equal(damagePlayer(game, 10000), true);
  assert.equal(game.player.health, 0);
  assert.equal(game.phase, 'game-over');
  damagePlayer(game, 1);
  advance(game, 2, { moveX: 1, attack: true });
  assert.equal(game.events.filter(event => event.type === 'game-over').length, 1);
});

test('fresh runs reset health, upgrades, rooms, encounters, hazards, and progress after either end state', () => {
  for (const end of ['game-over', 'victory']) {
    const game = startRun(createGame({ seed: 42 }));
    const original = JSON.stringify(game.dungeon);
    applyUpgrade(game.player, 'damage');
    applyUpgrade(game.player, 'survival');
    game.player.health = 12;
    game.roomIndex = 4;
    game.rooms[1].enemies[0].health = 0;
    game.rooms[1].cleared = true;
    game.rooms[1].rewardClaimed = true;
    game.rooms[4].hazards.push({ id: 'stale' });
    game.phase = end;
    startRun(game);
    assert.equal(game.player.health, 100);
    assert.equal(game.player.maxHealth, 100);
    assert.equal(game.player.damage, 20);
    assert.deepEqual(game.player.upgrades, []);
    assert.equal(game.roomIndex, 0);
    assert.equal(game.rooms[1].cleared, false);
    assert.equal(game.rooms[1].rewardClaimed, false);
    assert.ok(game.rooms[1].enemies.every(enemy => enemy.health === enemy.maxHealth));
    assert.equal(game.rooms[4].hazards.length, 0);
    assert.equal(game.time, 0);
    assert.equal(JSON.stringify(game.dungeon), original);
    returnToMenu(game);
    assert.equal(game.phase, 'menu');
    startRun(game, 17);
    assert.equal(game.seed, 17);
    assert.equal(game.phase, 'playing');
  }
});

test('boss defeat completes victory and repeated clears produce no duplicate reward', () => {
  const game = startRun(createGame());
  game.roomIndex = 1;
  clearRoom(game);
  chooseReward(game, game.pendingReward.offers[0]);
  advance(game, 0.2);
  assert.equal(game.pendingReward, null);
  game.roomIndex = 4;
  clearRoom(game);
  assert.equal(game.phase, 'victory');
  assert.equal(game.events.filter(event => event.type === 'victory').length, 1);
  assert.equal(game.rooms[4].cleared, true);
});

test('dynamic combat never mutates seed content signatures', () => {
  const game = startRun(createGame({ seed: 17 }));
  const content = JSON.stringify(game.dungeon);
  game.roomIndex = 1;
  advance(game, 4, { moveX: 1, aimX: 710, aimY: 160, attack: true });
  clearRoom(game);
  assert.equal(JSON.stringify(game.dungeon), content);
});
