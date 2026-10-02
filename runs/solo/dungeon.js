import { WIDTH, HEIGHT } from './constants.js';

export function parseSeed(value) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,10}$/.test(text) || Number(text) > 0xffffffff) return null;
  return Number(text);
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const LAYOUTS = [
  { name: 'Twin pillars', blocks: [[380, 155, 70, 110], [670, 375, 70, 110]] },
  { name: 'Broken colonnade', blocks: [[360, 130, 60, 95], [540, 425, 60, 95], [760, 130, 60, 95]] },
  { name: 'Split sanctum', blocks: [[400, 120, 160, 70], [560, 450, 160, 70]] },
  { name: 'Four sentinels', blocks: [[380, 140, 60, 65], [680, 140, 60, 65], [380, 435, 60, 65], [680, 435, 60, 65]] },
  { name: 'Sunken corners', blocks: [[290, 130, 110, 100], [740, 410, 110, 100]] },
];

function safeSpawn(random, blocks, index) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = 580 + random() * 390;
    const y = 105 + random() * 430;
    if (!blocks.some(b => x > b[0] - 32 && x < b[0] + b[2] + 32 && y > b[1] - 32 && y < b[1] + b[3] + 32)) return { x, y };
  }
  return { x: WIDTH - 150, y: HEIGHT / 2 + (index - 2) * 50 };
}

export function generateDungeon(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be an unsigned 32-bit integer.');
  const random = seededRandom(seed);
  const layouts = shuffle(LAYOUTS, random);
  const upgrades = shuffle(['edge', 'rhythm', 'stride', 'heart'], random);
  const names = ['The threshold', 'Cinder hall', 'The crossing', 'Ashen forge', 'Warden’s sanctum'];
  const rooms = names.map((name, index) => {
    const type = index === 0 ? 'start' : index === 4 ? 'boss' : 'combat';
    const layout = type === 'start' ? { name: 'Quiet threshold', blocks: [] } : type === 'boss' ? { name: 'Warden arena', blocks: [] } : layouts[index - 1];
    const types = type === 'start' ? [] : type === 'boss' ? ['boss'] : shuffle(['melee', 'ranged', 'elite', ...Array.from({ length: index - 1 }, () => ['melee', 'ranged', 'elite'][Math.floor(random() * 3)])], random);
    const enemies = types.map((kind, i) => ({ kind, ...(kind === 'boss' ? { x: 810, y: 320 } : safeSpawn(random, layout.blocks, i)) }));
    const offers = type !== 'combat' ? [] : index === 1 ? upgrades.slice(0, 2) : index === 2 ? upgrades.slice(2, 4) : shuffle(upgrades, random).slice(0, 2);
    return { id: index, name, type, layout: layout.name, blocks: layout.blocks.map(b => [...b]), enemies, offers, connections: [index - 1, index + 1].filter(i => i >= 0 && i < names.length) };
  });
  return { seed, rooms };
}

export function dungeonSignature(dungeon) {
  return {
    layouts: dungeon.rooms.map(r => ({ name: r.layout, blocks: r.blocks })),
    encounters: dungeon.rooms.map(r => r.enemies),
    offers: dungeon.rooms.map(r => r.offers),
  };
}
