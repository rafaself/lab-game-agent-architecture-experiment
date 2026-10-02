import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDungeon, dungeonSignature, parseSeed } from '../dungeon.js';
import { hitsBlock } from '../physics.js';

test('unsigned 32-bit seed input rejects ambiguous and out-of-range values', () => {
  assert.equal(parseSeed('0'), 0); assert.equal(parseSeed('4294967295'), 4294967295);
  for (const seed of ['', '-1', '1.5', '0x11', '1e3', '4294967296', null]) assert.equal(parseSeed(seed), null);
  assert.throws(() => generateDungeon(-1), RangeError);
});
for (const seed of [17, 42]) test(`seed ${seed} reproduces every layout, encounter and offer`, () => {
  assert.deepEqual(dungeonSignature(generateDungeon(seed)), dungeonSignature(generateDungeon(seed)));
});
test('17 and 42 vary layouts, encounter composition/placement and reward offers independently', () => {
  const a = dungeonSignature(generateDungeon(17)); const b = dungeonSignature(generateDungeon(42));
  for (const category of ['layouts', 'encounters', 'offers']) assert.notDeepEqual(a[category], b[category]);
  assert.notDeepEqual(generateDungeon(17).rooms.map(r => r.enemies.map(e => e.kind).sort()), generateDungeon(42).rooms.map(r => r.enemies.map(e => e.kind).sort()));
});
test('500 seeds preserve connected 5-room route, safe spawns and four reward categories', () => {
  for (let seed = 0; seed < 500; seed++) {
    const { rooms } = generateDungeon(seed);
    assert.deepEqual(rooms.map(r => r.type), ['start', 'combat', 'combat', 'combat', 'boss']);
    const visited = new Set(); const queue = [0];
    while (queue.length) { const i = queue.shift(); if (visited.has(i)) continue; visited.add(i); queue.push(...rooms[i].connections); }
    assert.equal(visited.size, 5);
    assert.equal(rooms[0].enemies.length, 0);
    for (const r of rooms) {
      for (const n of r.connections) assert.ok(rooms[n].connections.includes(r.id));
      for (const e of r.enemies) assert.ok(!r.blocks.some(b => hitsBlock(e.x, e.y, 25, b)));
      // Every layout keeps the full horizontal entry-to-exit lane unobstructed.
      for (const b of r.blocks) assert.ok(b[1] + b[3] < 300 || b[1] > 340);
    }
    const combat = rooms.filter(r => r.type === 'combat');
    for (const r of combat) { assert.equal(r.offers.length, 2); assert.equal(new Set(r.offers).size, 2); assert.ok(['melee','ranged','elite'].every(k => r.enemies.some(e => e.kind === k))); }
    assert.equal(new Set(combat.flatMap(r => r.offers)).size, 4);
  }
});
