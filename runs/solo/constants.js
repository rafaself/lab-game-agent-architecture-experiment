export const WIDTH = 1120;
export const HEIGHT = 640;
export const WALL = 38;
export const GATE_TOP = 267;
export const GATE_BOTTOM = 373;
export const BASE = Object.freeze({ maxHp: 100, damage: 22, cadence: 0.30, speed: 235, radius: 14 });
export const UPGRADES = Object.freeze({
  edge: { name: 'Tempered edge', category: 'Damage', icon: '↗', description: '+8 bolt damage', detail: 'Every shot hits harder. Best against the Warden.' },
  rhythm: { name: 'Quickening', category: 'Cadence', icon: '»', description: '25% shorter attack cooldown', detail: 'A faster stream of bolts. Keep pressure on moving targets.' },
  stride: { name: 'Windstep', category: 'Movement', icon: '↝', description: '+18% movement speed', detail: 'More room to dodge charges, volleys and blast circles.' },
  heart: { name: 'Ember heart', category: 'Survival', icon: '♡', description: '+30 maximum health; heal 30', detail: 'More breathing room for the battles ahead.' },
});
export const ENEMY_STATS = Object.freeze({
  melee: { name: 'Stalker', hp: 48, speed: 90, radius: 16, damage: 12 },
  ranged: { name: 'Seer', hp: 44, speed: 48, radius: 17, damage: 12 },
  elite: { name: 'Lancer', hp: 94, speed: 67, radius: 21, damage: 18 },
  boss: { name: 'The Warden', hp: 440, speed: 34, radius: 38, damage: 16 },
});
