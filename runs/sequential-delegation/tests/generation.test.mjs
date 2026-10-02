import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, parseSeed } from '../rng.mjs';
import { generateDungeon, dungeonSignatures } from '../dungeon.mjs';
import { blockedAt, findPath, lineBlocked, WORLD } from '../geometry.mjs';
import { ENEMY_STATS } from '../combat.mjs';

test('seed parser accepts the entire uint32 range and rejects invalid inputs', () => {
  assert.equal(parseSeed('0'), 0);
  assert.equal(parseSeed('4294967295'), 4294967295);
  for (const value of ['-1', '42x', '1.5', '4294967296', '', null]) assert.equal(parseSeed(value), 17);
  const a = createRng(17);
  const b = createRng(17);
  assert.deepEqual(Array.from({ length: 20 }, a), Array.from({ length: 20 }, b));
});

test('17 and 42 reproduce content twice and differ in all required signatures', () => {
  for (const seed of [17, 42]) {
    assert.deepEqual(dungeonSignatures(seed), dungeonSignatures(seed));
    assert.deepEqual(generateDungeon(seed), generateDungeon(seed));
  }
  const a = dungeonSignatures(17);
  const b = dungeonSignatures(42);
  for (const key of ['layouts', 'encounters', 'offers']) assert.notEqual(a[key], b[key], key);
  assert.notDeepEqual(generateDungeon(17).rooms.map(room => room.encounters.map(enemy => enemy.kind)),
    generateDungeon(42).rooms.map(room => room.encounters.map(enemy => enemy.kind)));
});

test('every generated route has start + three combat + boss with symmetric connected edges', () => {
  for (const seed of [0, 1, 17, 42, 0xffffffff]) {
    const dungeon = generateDungeon(seed);
    assert.deepEqual(dungeon.rooms.map(room => room.kind), ['start', 'combat', 'combat', 'combat', 'boss']);
    const visited = [];
    for (let index = 0; index !== null; index = dungeon.rooms[index].next) visited.push(index);
    assert.deepEqual(visited, [0, 1, 2, 3, 4]);
    for (const room of dungeon.rooms) {
      if (room.next !== null) assert.equal(dungeon.rooms[room.next].previous, room.index);
      assert.equal(lineBlocked(60, 300, 900, 300, room.obstacles, 22), false);
      for (const enemy of room.encounters) assert.equal(blockedAt(enemy.x, enemy.y, ENEMY_STATS[enemy.kind].radius, room.obstacles), false);
    }
  }
});

test('each combat room offers two different choices and all four effects occur before boss', () => {
  for (let seed = 0; seed < 100; seed++) {
    const rooms = generateDungeon(seed).rooms.filter(room => room.kind === 'combat');
    for (const room of rooms) assert.equal(new Set(room.offers).size, 2);
    assert.equal(new Set(rooms.flatMap(room => room.offers)).size, 4);
  }
});

test('seed generation remains immutable and the safe start contains no hostiles', () => {
  const dungeon = generateDungeon(17);
  assert.equal(dungeon.rooms[0].encounters.length, 0);
  assert.equal(Object.isFrozen(dungeon.rooms[2].encounters[0]), true);
  assert.throws(() => { dungeon.rooms[1].encounters[0].x = 0; }, TypeError);
});

test('visibility paths route around a blocking pillar without intersecting expanded geometry', () => {
  const obstacles = [{ x: 400, y: 200, width: 80, height: 200 }];
  const path = findPath(300, 300, 600, 300, 14, obstacles);
  assert.ok(path.length >= 3);
  let point = { x: 300, y: 300 };
  for (const next of path) {
    assert.equal(lineBlocked(point.x, point.y, next.x, next.y, obstacles, 17), false);
    assert.ok(next.x > WORLD.wall && next.x < WORLD.width - WORLD.wall);
    point = next;
  }
  assert.deepEqual(point, { x: 600, y: 300 });
});

test('all enemy spawns in 100 generated seeds can path to the entry corridor', () => {
  let checked = 0;
  for (let seed = 0; seed < 100; seed++) {
    for (const room of generateDungeon(seed).rooms) {
      for (const enemy of room.encounters) {
        const radius = ENEMY_STATS[enemy.kind].radius;
        assert.equal(blockedAt(enemy.x, enemy.y, radius, room.obstacles), false);
        assert.ok(findPath(enemy.x, enemy.y, 80, 300, radius, room.obstacles).length > 0, `${seed}:${enemy.id}`);
        checked++;
      }
    }
  }
  assert.equal(checked, 996);
});
