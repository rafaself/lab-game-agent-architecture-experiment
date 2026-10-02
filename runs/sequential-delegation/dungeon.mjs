import { createRng, deepFreeze, parseSeed, shuffle } from './rng.mjs';
import { UPGRADES } from './upgrades.mjs';

const LAYOUTS = [
  { id: 'pillars', obstacles: [{ x: 365, y: 105, width: 80, height: 105 }, { x: 515, y: 390, width: 80, height: 105 }] },
  { id: 'barricades', obstacles: [{ x: 315, y: 120, width: 185, height: 62 }, { x: 515, y: 418, width: 160, height: 62 }] },
  { id: 'split-hall', obstacles: [{ x: 450, y: 75, width: 60, height: 155 }, { x: 450, y: 370, width: 60, height: 155 }] },
  { id: 'alcoves', obstacles: [{ x: 260, y: 118, width: 90, height: 105 }, { x: 570, y: 90, width: 105, height: 65 }, { x: 570, y: 410, width: 105, height: 65 }] },
];
const ENCOUNTERS = [
  [['melee', 'melee', 'ranged'], ['melee', 'ranged', 'ranged']],
  [['elite', 'melee'], ['elite', 'melee', 'ranged']],
  [['elite', 'ranged', 'melee'], ['elite', 'ranged', 'ranged', 'melee']],
];
const SPAWNS = [{ x: 710, y: 160 }, { x: 770, y: 440 }, { x: 810, y: 290 }, { x: 640, y: 300 }];

export function generateDungeon(seedValue = 17) {
  const seed = parseSeed(seedValue);
  const random = createRng(seed);
  const upgradeOrder = shuffle(Object.keys(UPGRADES), random);
  const third = shuffle(Object.keys(UPGRADES), random).slice(0, 2);
  const offers = [upgradeOrder.slice(0, 2), upgradeOrder.slice(2, 4), third];
  const rooms = [{ index: 0, id: 'room-0', kind: 'start', name: 'Quiet Threshold',
    layout: 'sanctuary', obstacles: [], encounters: [], offers: [], previous: null, next: 1 }];
  for (let i = 0; i < 3; i++) {
    const layout = LAYOUTS[Math.floor(random() * LAYOUTS.length)];
    const kinds = ENCOUNTERS[i][Math.floor(random() * ENCOUNTERS[i].length)];
    const spawns = shuffle(SPAWNS, random);
    const mirrored = random() < 0.5;
    rooms.push({ index: i + 1, id: `room-${i + 1}`, kind: 'combat',
      name: ['Ember Gallery', 'Sentinel Hall', 'Last Watch'][i],
      layout: `${layout.id}${mirrored ? '-mirror' : ''}`,
      obstacles: layout.obstacles.map(obstacle => ({ ...obstacle,
        y: mirrored ? 600 - obstacle.y - obstacle.height : obstacle.y })),
      encounters: kinds.map((kind, j) => ({ id: `room-${i + 1}-enemy-${j}`, kind,
        x: spawns[j].x, y: spawns[j].y, initialCooldown: 0.65 + random() * 0.6 })),
      offers: offers[i], previous: i, next: i + 2,
    });
  }
  rooms.push({ index: 4, id: 'room-4', kind: 'boss', name: 'Warden of the Gate',
    layout: 'warden-arena', obstacles: [], offers: [], previous: 3, next: null,
    encounters: [{ id: 'warden', kind: 'boss', x: 700, y: 300, initialCooldown: 1.1 }] });
  return deepFreeze({ seed, rooms });
}

export function dungeonSignatures(seed) {
  const dungeon = generateDungeon(seed);
  return {
    seed: dungeon.seed,
    layouts: JSON.stringify(dungeon.rooms.map(room => ({ layout: room.layout, obstacles: room.obstacles }))),
    encounters: JSON.stringify(dungeon.rooms.map(room => room.encounters)),
    offers: JSON.stringify(dungeon.rooms.map(room => room.offers)),
  };
}
