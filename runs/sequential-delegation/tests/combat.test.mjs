import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startRun, updateGame, currentRoom } from '../model.mjs';
import { createEnemy, damageEnemy, playerAttack } from '../combat.mjs';

function arena(kind, x = 600, y = 300) {
  const game = startRun(createGame());
  game.roomIndex = 4;
  game.player.x = 400;
  game.player.y = 300;
  game.player.invulnerable = 0;
  const enemy = createEnemy({ id: 'target', kind, x, y, initialCooldown: 0 });
  game.rooms[4].enemies = [enemy];
  return { game, enemy, room: game.rooms[4] };
}

function advance(game, seconds, input = {}, frame = 1 / 60) {
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += frame) updateGame(game, Math.min(frame, seconds - elapsed), input);
}

test('slash is aimed, range-limited, and one cooldown cannot repeatedly damage', () => {
  const { game, enemy } = arena('elite', 480);
  game.player.aimAngle = Math.PI;
  playerAttack(game);
  assert.equal(enemy.health, 70);
  game.player.cooldown = 0;
  game.player.aimAngle = 0;
  assert.equal(playerAttack(game), true);
  assert.equal(enemy.health, 50);
  assert.equal(playerAttack(game), false);
  assert.equal(enemy.health, 50);
  enemy.x = 700;
  game.player.cooldown = 0;
  playerAttack(game);
  assert.equal(enemy.health, 50);
  assert.ok(game.effects.some(effect => effect.kind === 'slash'));
});

test('walls block slash hits and player circle movement', () => {
  const game = startRun(createGame({ seed: 17 }));
  game.roomIndex = 1;
  const obstacle = game.dungeon.rooms[1].obstacles[0];
  const enemy = createEnemy({ id: 'shielded', kind: 'elite',
    x: obstacle.x + obstacle.width + 23, y: obstacle.y + obstacle.height / 2, initialCooldown: 100 });
  game.rooms[1].enemies = [enemy];
  game.player.x = obstacle.x - 17;
  game.player.y = enemy.y;
  game.player.attackRange = 400;
  game.player.aimAngle = 0;
  playerAttack(game);
  assert.equal(enemy.health, 70);
  const x = game.player.x;
  advance(game, 0.2, { moveX: 1 });
  assert.ok(game.player.x <= x + 2);
});

test('melee pursues and visibly winds up before an avoidable close strike', () => {
  const { game, enemy } = arena('melee', 650);
  advance(game, 0.5);
  assert.ok(enemy.x < 650);
  enemy.x = 440;
  advance(game, 1 / 120);
  assert.equal(enemy.state, 'windup');
  assert.equal(enemy.attack.kind, 'melee');
  const health = game.player.health;
  advance(game, 0.5, { moveY: -1 });
  assert.equal(game.player.health, health);
  const stationary = arena('melee', 440);
  advance(stationary.game, 0.5);
  assert.equal(stationary.game.player.health, 92);
  assert.ok(stationary.game.events.some(event => event.type === 'player-damaged'));
});

test('ranged locks its aim during a warning, fires a projectile, and movement evades it', () => {
  const still = arena('ranged', 650);
  advance(still.game, 1 / 120);
  assert.equal(still.enemy.state, 'windup');
  assert.equal(still.enemy.attack.kind, 'shot');
  assert.equal(still.enemy.attack.targetY, 300);
  advance(still.game, 0.9);
  assert.ok(still.room.projectiles.length > 0);
  advance(still.game, 1.1);
  assert.equal(still.game.player.health, 90);
  const dodged = arena('ranged', 650);
  advance(dodged.game, 0.2);
  const angle = dodged.enemy.attack.angle;
  advance(dodged.game, 0.5, { moveY: -1 });
  assert.equal(dodged.enemy.attack.angle, angle);
  advance(dodged.game, 1.3);
  assert.equal(dodged.game.player.health, 100);
});

test('elite has a telegraphed fixed-direction charge, distinct damage, and finite recovery', () => {
  const hit = arena('elite', 600);
  advance(hit.game, 0.2);
  assert.equal(hit.enemy.attack.kind, 'charge');
  assert.equal(hit.enemy.state, 'windup');
  advance(hit.game, 1.5);
  assert.equal(hit.game.player.health, 85);
  assert.equal(hit.enemy.state, 'idle');
  assert.ok(hit.enemy.cooldown > 0);
  const dodged = arena('elite', 600);
  advance(dodged.game, 0.2);
  advance(dodged.game, 0.8, { moveY: -1 });
  advance(dodged.game, 0.8);
  assert.equal(dodged.game.player.health, 100);
});

test('boss alternates fan and nova; both warnings give movement counterplay', () => {
  const { game, enemy, room } = arena('boss', 700);
  advance(game, 0.1);
  assert.equal(enemy.attack.kind, 'fan');
  advance(game, 1.05, { moveY: -1 });
  assert.equal(room.projectiles.length, 5);
  advance(game, 1.5, { moveX: 1 });
  assert.equal(enemy.attack.kind, 'nova');
  assert.equal(room.hazards.length, 3);
  assert.ok(room.hazards.every(hazard => hazard.timer > 1));
  advance(game, 1.4, { moveX: -1 });
  assert.equal(game.player.health, 100);
  assert.ok(game.events.some(event => event.type === 'hazard-exploded'));
  assert.deepEqual(game.events.filter(event => event.type === 'enemy-telegraph').slice(0, 2).map(event => event.pattern), ['fan', 'nova']);
});

test('boss nova deals area damage when the player remains inside its marked zone', () => {
  const { game, enemy } = arena('boss', 700);
  enemy.patternIndex = 1;
  advance(game, 1.3);
  assert.equal(game.player.health, 84);
  assert.ok(game.events.some(event => event.type === 'player-damaged' && event.source === 'boss-nova'));
});

test('enemy defeat has its own event and visual, and happens once', () => {
  const { game, enemy } = arena('melee', 480);
  damageEnemy(game, enemy, 100);
  damageEnemy(game, enemy, 100);
  assert.equal(enemy.health, 0);
  assert.equal(enemy.state, 'dead');
  assert.equal(game.events.filter(event => event.type === 'enemy-defeated').length, 1);
  assert.ok(game.effects.some(effect => effect.kind === 'enemy-defeat'));
});

test('combat behavior is independent of 30 Hz versus 144 Hz rendering', () => {
  const a = arena('boss', 700);
  const b = arena('boss', 700);
  advance(a.game, 4, {}, 1 / 30);
  advance(b.game, 4, {}, 1 / 144);
  assert.deepEqual(a.enemy, b.enemy);
  assert.deepEqual(a.room.projectiles, b.room.projectiles);
  assert.deepEqual(a.room.hazards, b.room.hazards);
  assert.equal(a.game.player.health, b.game.player.health);
});
