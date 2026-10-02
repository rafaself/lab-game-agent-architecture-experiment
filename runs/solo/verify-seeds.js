import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateDungeon, dungeonSignature } from './dungeon.js';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const categories = ['layouts', 'encounters', 'offers'];
const signatures = new Map();
for (const seed of [17, 42]) {
  for (let check = 1; check <= 2; check++) {
    const a = dungeonSignature(generateDungeon(seed));
    const b = dungeonSignature(generateDungeon(seed));
    assert.deepEqual(a, b);
    if (signatures.has(seed)) assert.deepEqual(a, signatures.get(seed));
    signatures.set(seed, a);
    console.log(`PASS seed ${seed} repeat check ${check}`);
    for (const category of categories) console.log(`  ${category}: ${hash(a[category])}`);
  }
}
for (const category of categories) {
  assert.notDeepEqual(signatures.get(17)[category], signatures.get(42)[category]);
  console.log(`PASS 17/42 variation: ${category}`);
}
