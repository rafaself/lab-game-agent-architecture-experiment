import { BASE, ENEMY_STATS, UPGRADES, WIDTH, HEIGHT, WALL, GATE_TOP, GATE_BOTTOM } from './constants.js';
import { generateDungeon } from './dungeon.js';
import { clamp, direction, moveBody } from './physics.js';

export function createRun(seed) {
  const dungeon = generateDungeon(seed);
  const rooms = dungeon.rooms.map(room => ({ ...room, cleared: room.type === 'start', rewarded: room.type !== 'combat', enemies: room.enemies.map((e, i) => ({ ...ENEMY_STATS[e.kind], ...e, maxHp: ENEMY_STATS[e.kind].hp, id: `${room.id}-${i}`, phase: 'idle', timer: 1 + i * .3, flash: 0, pattern: 0, target: null })) }));
  return {
    seed, dungeon, rooms, roomIndex: 0, state: 'playing', paused: false,
    player: { ...BASE, hp: BASE.maxHp, x: 200, y: HEIGHT / 2, angle: 0, invulnerable: 0, cooldown: 0, upgrades: [] },
    projectiles: [], hazards: [], effects: [], events: [], time: 0, kills: 0, rewardPending: false, notice: '', noticeTimer: 0,
  };
}

export const currentRoom = run => run.rooms[run.roomIndex];
export const livingEnemies = run => currentRoom(run).enemies.filter(e => e.hp > 0);
export const exitLocked = run => livingEnemies(run).length > 0;
export function emit(run, type, extra = {}) { run.events.push({ type, ...extra }); }
export function notice(run, text) { run.notice = text; run.noticeTimer = 2.5; }

export function damagePlayer(run, amount) {
  const p = run.player;
  if (run.state !== 'playing' || run.paused || run.rewardPending || p.invulnerable > 0) return false;
  p.hp = clamp(p.hp - Math.max(0, amount), 0, p.maxHp);
  p.invulnerable = 1.05;
  run.effects.push({ type: 'damage', x: p.x, y: p.y, life: .6, total: .6 });
  emit(run, 'damage');
  if (p.hp === 0) { run.state = 'gameover'; emit(run, 'gameover'); }
  return true;
}

export function damageEnemy(run, enemy, amount) {
  if (enemy.hp <= 0 || run.state !== 'playing') return false;
  enemy.hp = clamp(enemy.hp - amount, 0, enemy.maxHp);
  enemy.flash = .12;
  run.effects.push({ type: 'hit', x: enemy.x, y: enemy.y, life: .24, total: .24 });
  if (enemy.hp === 0) {
    run.kills++;
    run.effects.push({ type: 'defeat', x: enemy.x, y: enemy.y, life: .7, total: .7 });
    emit(run, 'enemyDefeat');
    checkRoomClear(run);
  }
  return true;
}

export function checkRoomClear(run) {
  const room = currentRoom(run);
  if (room.cleared || livingEnemies(run).length) return;
  room.cleared = true;
  run.projectiles = []; run.hazards = [];
  if (room.type === 'boss') { run.state = 'victory'; emit(run, 'victory'); }
  else if (room.type === 'combat' && !room.rewarded) { run.rewardPending = true; emit(run, 'roomClear'); }
}

export function selectUpgrade(run, id) {
  const room = currentRoom(run);
  if (!run.rewardPending || !room.offers.includes(id)) return false;
  const p = run.player;
  if (id === 'edge') p.damage += 8;
  if (id === 'rhythm') p.cadence *= .75;
  if (id === 'stride') p.speed *= 1.18;
  if (id === 'heart') { p.maxHp += 30; p.hp = clamp(p.hp + 30, 0, p.maxHp); }
  p.upgrades.push(id);
  room.rewarded = true;
  run.rewardPending = false;
  notice(run, `${UPGRADES[id].name} acquired · exit open`);
  emit(run, 'upgrade');
  return true;
}

export function travel(run, delta) {
  const next = run.roomIndex + delta;
  if (run.state !== 'playing' || run.paused || run.rewardPending || exitLocked(run) || !currentRoom(run).connections.includes(next)) return false;
  run.roomIndex = next;
  run.player.x = delta > 0 ? WALL + 52 : WIDTH - WALL - 52;
  run.player.y = HEIGHT / 2;
  run.player.invulnerable = .6;
  run.projectiles = []; run.hazards = []; run.effects = [];
  notice(run, currentRoom(run).type === 'boss' ? 'The Warden · dodge circles and radial volleys' : currentRoom(run).name);
  emit(run, 'travel');
  return true;
}

export function movePlayer(run, x, y, dt) {
  const p = run.player;
  const dir = direction(x, y);
  moveBody(p, dir.x * p.speed * dt, dir.y * p.speed * dt, currentRoom(run).blocks);
  if (p.y > GATE_TOP + p.radius && p.y < GATE_BOTTOM - p.radius) {
    if (x > 0 && p.x >= WIDTH - WALL - p.radius - 1) {
      if (!travel(run, 1) && exitLocked(run)) notice(run, 'Exit sealed · defeat all hostiles');
    }
    if (x < 0 && p.x <= WALL + p.radius + 1) {
      if (!travel(run, -1) && exitLocked(run)) notice(run, 'Exit sealed · defeat all hostiles');
    }
  }
}
