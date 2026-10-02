import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { dungeonSignatures, generateDungeon } from './dungeon.mjs';

const results = [17, 42].map(seed => {
  const first = dungeonSignatures(seed);
  const second = dungeonSignatures(seed);
  assert.deepEqual(first, second);
  return { seed, repeatedIdentically: true,
    hashes: Object.fromEntries(['layouts', 'encounters', 'offers'].map(key =>
      [key, createHash('sha256').update(first[key]).digest('hex')])),
    rooms: generateDungeon(seed).rooms.map(room => ({ index: room.index, kind: room.kind,
      layout: room.layout, obstacles: room.obstacles, encounters: room.encounters, offers: room.offers })) };
});
for (const key of ['layouts', 'encounters', 'offers']) assert.notEqual(results[0].hashes[key], results[1].hashes[key]);
console.log(JSON.stringify(results, null, 2));
