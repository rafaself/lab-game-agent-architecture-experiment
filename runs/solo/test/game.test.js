import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE } from '../constants.js';
import { createRun, currentRoom, travel, exitLocked, damageEnemy, damagePlayer, selectUpgrade, movePlayer } from '../state.js';
import { update, attack } from '../combat.js';

function step(run, seconds, input = {}) { for (let t = 0; t < seconds; t += .02) update(run, input, .02); }
function clear(run) { for (const enemy of [...currentRoom(run).enemies]) damageEnemy(run, enemy, 10000); }
function encounter(kind) {
  const run = createRun(17); travel(run, 1);
  const target = currentRoom(run).enemies.find(e => e.kind === kind);
  currentRoom(run).enemies = [target]; currentRoom(run).blocks = [];
  run.player.x = 300; run.player.y = 320; run.player.invulnerable = 0;
  target.x = 550; target.y = 320; target.timer = .1;
  return { run, target };
}

test('last hostile opens doors while reward choice pauses travel, then travel succeeds', () => {
  const run = createRun(17); assert.equal(travel(run, 1), true); assert.equal(exitLocked(run), true);
  assert.equal(travel(run, 1), false); assert.equal(travel(run, -1), false);
  const enemies = [...currentRoom(run).enemies];
  damageEnemy(run, enemies[0], 1000); assert.equal(exitLocked(run), true);
  clear(run); assert.equal(run.rewardPending, true); assert.equal(exitLocked(run), false); assert.equal(travel(run, 1), false);
  assert.equal(selectUpgrade(run, 'invalid'), false);
  assert.equal(selectUpgrade(run, currentRoom(run).offers[0]), true);
  assert.equal(selectUpgrade(run, currentRoom(run).offers[0]), false);
  assert.equal(exitLocked(run), false); assert.equal(travel(run, 1), true);
});
test('all four upgrades apply their material effect and persist across travel', () => {
  for (const id of ['edge', 'rhythm', 'stride', 'heart']) {
    const run = createRun(17); travel(run, 1); clear(run); currentRoom(run).offers = [id, id === 'edge' ? 'heart' : 'edge'];
    run.player.hp = 40; selectUpgrade(run, id);
    if (id === 'edge') assert.equal(run.player.damage, BASE.damage + 8);
    if (id === 'rhythm') assert.equal(run.player.cadence, BASE.cadence * .75);
    if (id === 'stride') assert.equal(run.player.speed, BASE.speed * 1.18);
    if (id === 'heart') { assert.equal(run.player.maxHp, 130); assert.equal(run.player.hp, 70); }
    travel(run, 1); assert.deepEqual(run.player.upgrades, [id]);
  }
});
test('fresh run resets health, upgrades, encounters, room, projectiles and timers', () => {
  const run = createRun(17); travel(run, 1); clear(run); selectUpgrade(run, currentRoom(run).offers[0]); run.player.hp = 5;
  const fresh = createRun(17);
  assert.equal(fresh.roomIndex, 0); assert.equal(fresh.player.hp, 100); assert.equal(fresh.player.maxHp, 100);
  assert.equal(fresh.player.damage, BASE.damage); assert.equal(fresh.player.cadence, BASE.cadence); assert.equal(fresh.player.speed, BASE.speed);
  assert.deepEqual(fresh.player.upgrades, []); assert.equal(fresh.time, 0); assert.equal(fresh.kills, 0);
  assert.equal(fresh.rooms[1].cleared, false); assert.ok(fresh.rooms[1].enemies.every(e => e.hp === e.maxHp)); assert.deepEqual(fresh.projectiles, []);
});
test('health clamps, invulnerability blocks continuous damage, defeat fires once', () => {
  const run = createRun(17); assert.equal(damagePlayer(run, 12), true); assert.equal(run.player.hp, 88);
  assert.equal(damagePlayer(run, 12), false); step(run, 1.1); assert.equal(damagePlayer(run, 1000), true);
  assert.equal(run.player.hp, 0); assert.equal(run.state, 'gameover'); assert.equal(damagePlayer(run, 1), false);
  assert.equal(run.events.filter(e => e.type === 'gameover').length, 1);
});
test('normalized movement has equal cardinal/diagonal speed and collides with pillars', () => {
  const a = createRun(17); const b = createRun(17);
  movePlayer(a, 1, 0, .3); movePlayer(b, 1, 1, .3);
  assert.ok(Math.abs(Math.hypot(a.player.x - 200, a.player.y - 320) - Math.hypot(b.player.x - 200, b.player.y - 320)) < .001);
  a.rooms[0].blocks = [[250, 250, 30, 150]]; a.player.x = 235; movePlayer(a, 1, 0, .04); assert.equal(a.player.x, 235);
});
test('projectile attack hits the aimed enemy and enforces cadence', () => {
  const { run, target } = encounter('melee'); target.x = 420; target.y = 320; target.speed = 0;
  run.player.angle = 0; assert.equal(attack(run), true); assert.equal(attack(run), false);
  step(run, .2); assert.equal(target.hp, target.maxHp - BASE.damage); assert.ok(run.effects.some(e => e.type === 'hit'));
});
test('melee pursues, telegraphs close strike, hits stationary player and permits dodge', () => {
  const { run, target } = encounter('melee'); step(run, .5); assert.ok(target.x < 550);
  target.x = 350; target.timer = 0; step(run, .02); assert.equal(target.phase, 'windup');
  step(run, .55); assert.equal(run.player.hp, 88);
  run.player.invulnerable = 0; target.timer = 0; target.x = 350; step(run, .02); run.player.y = 450; step(run, .55); assert.equal(run.player.hp, 88);
});
test('ranged sightline commits its target and projectile can be sidestepped', () => {
  const { run, target } = encounter('ranged'); step(run, .15); assert.equal(target.phase, 'windup');
  const aim = { ...target.target }; run.player.y = 450; step(run, 2.1);
  assert.equal(aim.y, 320); assert.equal(run.player.hp, 100); assert.ok(run.events.some(e => e.type === 'enemyAttack'));
  const stationary = encounter('ranged'); step(stationary.run, 2.2); assert.ok(stationary.run.player.hp < 100);
});
test('elite telegraphs charge with distinct speed and allows perpendicular escape', () => {
  const { run, target } = encounter('elite'); step(run, .15); assert.equal(target.phase, 'windup');
  run.player.y = 460; step(run, 1.1); assert.equal(target.phase, 'charge'); assert.ok(target.x < 550); assert.equal(run.player.hp, 100);
  const stationary = encounter('elite'); step(stationary.run, 1.6); assert.ok(stationary.run.player.hp < 100);
});
test('boss alternates warned radial volley and area blasts, both avoidable', () => {
  const run = createRun(17); run.roomIndex = 4; const boss = currentRoom(run).enemies[0];
  boss.timer = 0; run.player.x = 130; run.player.y = 100; step(run, .02);
  assert.equal(boss.phase, 'windup'); assert.equal(boss.pattern, 1); step(run, 1.12); assert.equal(run.projectiles.length, 12);
  // Move to a known radial gap outside projectile paths.
  run.player.x = 130; run.player.y = 500; step(run, .5); assert.equal(run.player.hp, 100);
  run.projectiles = []; boss.timer = 0; boss.phase = 'idle'; step(run, .02);
  assert.equal(boss.pattern, 2); assert.equal(run.hazards.length, 3); assert.ok(run.hazards.every(h => h.warning > 1));
  run.player.y = 200; step(run, 1.7); assert.equal(run.player.hp, 100);
});
test('boss defeat reaches Victory once and end states freeze combat', () => {
  const run = createRun(42); run.roomIndex = 4;
  damageEnemy(run, currentRoom(run).enemies[0], 10000); assert.equal(run.state, 'victory');
  assert.equal(run.events.filter(e => e.type === 'victory').length, 1);
  const x = run.player.x; step(run, 1, { x: 1, attack: true }); assert.equal(run.player.x, x); assert.equal(attack(run), false);
});
test('pause and reward freeze enemy AI, hazards, movement and attack', () => {
  const { run, target } = encounter('elite'); run.paused = true;
  step(run, 1, { x: 1, attack: true }); assert.equal(target.timer, .1); assert.equal(run.player.x, 300);
  run.paused = false; clear(run); step(run, 1, { x: 1, attack: true }); assert.equal(run.player.x, 300); assert.equal(run.projectiles.length, 0);
});
