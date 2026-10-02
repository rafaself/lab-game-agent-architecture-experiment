import { UPGRADE_IDS } from './rules.mjs';

const ROOM_SEQUENCE = Object.freeze(['start', 'combat', 'combat', 'combat', 'boss']);

const LAYOUTS = Object.freeze([
  {
    id: 'twin-pillars', name: 'Twin Pillars',
    pillars: [{ x: 0.38, y: 0.34, r: 27 }, { x: 0.62, y: 0.66, r: 27 }],
  },
  {
    id: 'broken-ring', name: 'Broken Ring',
    pillars: [
      { x: 0.5, y: 0.25, r: 23 }, { x: 0.68, y: 0.38, r: 23 },
      { x: 0.64, y: 0.68, r: 23 }, { x: 0.34, y: 0.72, r: 23 },
    ],
  },
  {
    id: 'crossroads', name: 'Crossroads',
    pillars: [{ x: 0.5, y: 0.38, r: 29 }, { x: 0.5, y: 0.67, r: 29 }],
  },
  {
    id: 'sunken-court', name: 'Sunken Court',
    pillars: [
      { x: 0.3, y: 0.29, r: 25 }, { x: 0.72, y: 0.3, r: 25 },
      { x: 0.3, y: 0.7, r: 25 }, { x: 0.72, y: 0.69, r: 25 },
    ],
  },
  {
    id: 'long-hall', name: 'Long Hall',
    pillars: [{ x: 0.38, y: 0.51, r: 31 }, { x: 0.65, y: 0.51, r: 31 }],
  },
  {
    id: 'quiet-garden', name: 'Quiet Garden',
    pillars: [
      { x: 0.45, y: 0.27, r: 21 }, { x: 0.58, y: 0.46, r: 21 },
      { x: 0.4, y: 0.68, r: 21 }, { x: 0.72, y: 0.72, r: 21 },
    ],
  },
]);

const SPAWN_POINTS = Object.freeze([
  [235, 132], [340, 132], [490, 132], [640, 132], [780, 132],
  [255, 205], [430, 205], [690, 205], [820, 205],
  [245, 320], [380, 320], [600, 320], [795, 320],
  [255, 435], [430, 435], [690, 435], [820, 435],
  [235, 508], [340, 508], [490, 508], [640, 508], [780, 508],
]);

export function normalizeSeed(value) {
  const source = String(value ?? '').trim();
  if (!/^\d{1,10}$/.test(source)) return null;
  const number = Number(source);
  if (!Number.isSafeInteger(number) || number < 0 || number > 0xffffffff) return null;
  return number >>> 0;
}

export function createRandomSeed() {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function isSpawnClear(point, layout) {
  return layout.pillars.every((pillar) => {
    const dx = point[0] - pillar.x * 960;
    const dy = point[1] - pillar.y * 640;
    return Math.hypot(dx, dy) > pillar.r + 52;
  });
}

function makeEncounter(types, layout, random, roomNumber) {
  const candidates = shuffle(SPAWN_POINTS.filter((point) => isSpawnClear(point, layout)), random);
  return types.map((type, index) => {
    const point = candidates[index] ?? SPAWN_POINTS[index];
    return {
      id: `r${roomNumber}-e${index + 1}`,
      type,
      x: point[0],
      y: point[1],
    };
  });
}

function makeOffers(random) {
  const order = shuffle(UPGRADE_IDS, random);
  return [
    [order[0], order[1]],
    [order[2], order[3]],
    [order[0], order[2]],
  ];
}

export function generateDungeon(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('Seed must be an unsigned 32-bit integer.');
  }

  const random = createSeededRandom(seed);
  const layouts = shuffle(LAYOUTS, random);
  const offers = makeOffers(random);
  const rooms = ROOM_SEQUENCE.map((type, index) => {
    const layout = layouts[index % layouts.length];
    let encounter = [];

    if (type === 'combat') {
      const combatNumber = index;
      let enemyTypes;
      if (combatNumber === 1) {
        enemyTypes = ['melee', 'melee', ...(random() < 0.58 ? ['ranged'] : [])];
      } else if (combatNumber === 2) {
        enemyTypes = ['melee', 'ranged', random() < 0.5 ? 'melee' : 'ranged'];
      } else {
        enemyTypes = ['elite', 'melee', 'ranged', random() < 0.5 ? 'elite' : 'ranged'];
      }
      encounter = makeEncounter(enemyTypes, layout, random, combatNumber);
    }

    return {
      id: `room-${index + 1}`,
      index,
      type,
      name: type === 'start' ? 'The Threshold' : type === 'boss' ? 'The Hollow Crown' : `Chamber ${index}`,
      layout: { id: layout.id, name: layout.name, pillars: layout.pillars.map((pillar) => ({ ...pillar })) },
      encounter,
      offers: type === 'combat' ? offers[index - 1].map((id) => id) : [],
    };
  });

  return { seed: seed >>> 0, rooms };
}

export function dungeonSignature(dungeon) {
  return JSON.stringify(dungeon.rooms.map((room) => ({
    type: room.type,
    layout: room.layout.id,
    encounter: room.encounter.map(({ type, x, y }) => ({ type, x, y })),
    offers: room.offers,
  })));
}

export function generationDetails(dungeon) {
  return dungeon.rooms.map((room) => ({
    room: room.index + 1,
    type: room.type,
    layout: room.layout.name,
    enemies: room.encounter.map((enemy) => enemy.type),
    offers: [...room.offers],
  }));
}
