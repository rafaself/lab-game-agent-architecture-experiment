import { generateDungeon } from './dungeon.mjs';
import { BASE_STATS, applyUpgrade } from './upgrades.mjs';
import { createEnemy, playerAttack, tickCombat } from './combat.mjs';
import { emit } from './events.mjs';
import { moveCircle, WORLD } from './geometry.mjs';
import { parseSeed } from './rng.mjs';

export { drainEvents } from './events.mjs';
export { WORLD } from './geometry.mjs';
export const FIXED_STEP = 1 / 120;

function freshPlayer() {
  return { ...BASE_STATS, x: 92, y: 300, radius: 15, health: BASE_STATS.maxHealth,
    aimAngle: 0, invulnerable: 0, damageFlash: 0, cooldown: 0, upgrades: [] };
}

export function createGame({ seed = 17 } = {}) {
  const game = { seed: parseSeed(seed), phase: 'menu', events: [], effects: [] };
  resetRun(game, game.seed);
  game.phase = 'menu';
  return game;
}

function resetRun(game, seed) {
  game.seed = parseSeed(seed);
  game.dungeon = generateDungeon(game.seed);
  game.rooms = game.dungeon.rooms.map(room => ({ index: room.index,
    visited: room.index === 0, cleared: room.kind === 'start', rewardClaimed: room.kind !== 'combat',
    enemies: room.encounters.map(createEnemy), projectiles: [], hazards: [] }));
  game.player = freshPlayer();
  game.roomIndex = 0;
  game.pendingReward = null;
  game.time = 0;
  game.accumulator = 0;
  game.nextId = 1;
  game.events = [];
  game.effects = [];
  game.lockMessageCooldown = 0;
}

export function startRun(game, seed = game.seed) {
  resetRun(game, seed);
  game.phase = 'playing';
  emit(game, 'run-started', { seed: game.seed });
  return game;
}

export function returnToMenu(game) {
  game.phase = 'menu';
  game.pendingReward = null;
  game.accumulator = 0;
  emit(game, 'menu-opened');
}

export function currentRoom(game) {
  return { definition: game.dungeon.rooms[game.roomIndex], runtime: game.rooms[game.roomIndex] };
}

export function isRoomLocked(game, roomIndex = game.roomIndex) {
  return game.rooms[roomIndex].enemies.some(enemy => enemy.health > 0);
}

function enterRoom(game, roomIndex, fromEast) {
  game.roomIndex = roomIndex;
  const room = game.rooms[roomIndex];
  room.visited = true;
  game.player.x = fromEast ? WORLD.width - 78 : 78;
  game.player.y = 300;
  game.player.cooldown = 0;
  game.player.invulnerable = Math.max(game.player.invulnerable, 0.55);
  emit(game, 'room-entered', { roomIndex, kind: game.dungeon.rooms[roomIndex].kind });
}

function movePlayer(game, dt, input) {
  const player = game.player;
  let moveX = Number(input.moveX) || 0;
  let moveY = Number(input.moveY) || 0;
  const length = Math.hypot(moveX, moveY);
  if (length > 1) { moveX /= length; moveY /= length; }
  const { definition } = currentRoom(game);
  const dx = moveX * player.speed * dt;
  const dy = moveY * player.speed * dt;
  const nextX = player.x + dx;
  const inDoor = player.y > WORLD.doorTop + player.radius && player.y < WORLD.doorBottom - player.radius;
  if (inDoor && (nextX < WORLD.wall + player.radius || nextX > WORLD.width - WORLD.wall - player.radius)) {
    const target = nextX < WORLD.width / 2 ? definition.previous : definition.next;
    if (target !== null && !isRoomLocked(game)) {
      enterRoom(game, target, nextX < WORLD.width / 2);
      return;
    }
    if (target !== null && isRoomLocked(game) && game.lockMessageCooldown <= 0) {
      emit(game, 'door-blocked', { roomIndex: game.roomIndex });
      game.lockMessageCooldown = 1.0;
    }
  }
  moveCircle(player, dx, dy, definition.obstacles);
}

function completeRoom(game) {
  const { definition, runtime } = currentRoom(game);
  if (runtime.cleared || isRoomLocked(game)) return;
  runtime.cleared = true;
  runtime.projectiles = [];
  runtime.hazards = [];
  emit(game, 'room-cleared', { roomIndex: game.roomIndex, kind: definition.kind });
  if (definition.kind === 'boss') {
    game.phase = 'victory';
    emit(game, 'victory', { seed: game.seed, time: game.time });
  } else if (definition.kind === 'combat' && !runtime.rewardClaimed) {
    game.pendingReward = { roomIndex: game.roomIndex, offers: [...definition.offers] };
    emit(game, 'reward-offered', { roomIndex: game.roomIndex, offers: [...definition.offers] });
  }
}

export function chooseReward(game, id) {
  if (game.phase !== 'playing' || !game.pendingReward || !game.pendingReward.offers.includes(id)) return false;
  applyUpgrade(game.player, id);
  const roomIndex = game.pendingReward.roomIndex;
  game.rooms[roomIndex].rewardClaimed = true;
  game.pendingReward = null;
  game.accumulator = 0;
  emit(game, 'upgrade-selected', { id, roomIndex });
  return true;
}

function fixedUpdate(game, input) {
  const dt = FIXED_STEP;
  game.time += dt;
  game.lockMessageCooldown = Math.max(0, game.lockMessageCooldown - dt);
  const player = game.player;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.damageFlash = Math.max(0, player.damageFlash - dt);
  player.cooldown = Math.max(0, player.cooldown - dt);
  for (const visual of game.effects) visual.remaining -= dt;
  game.effects = game.effects.filter(visual => visual.remaining > 0);
  if (Number.isFinite(input.aimX) && Number.isFinite(input.aimY)) {
    const dx = input.aimX - player.x;
    const dy = input.aimY - player.y;
    if (Math.hypot(dx, dy) > 1) player.aimAngle = Math.atan2(dy, dx);
  }
  movePlayer(game, dt, input);
  if (input.attack) playerAttack(game);
  completeRoom(game);
  if (game.phase !== 'playing' || game.pendingReward) return;
  tickCombat(game, dt);
  if (game.phase === 'playing') completeRoom(game);
}

export function updateGame(game, elapsedSeconds, input = {}) {
  if (game.phase !== 'playing' || game.pendingReward) { game.accumulator = 0; return; }
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;
  // Drop long background-tab gaps; normal frame partitions share the same 120 Hz steps.
  game.accumulator += Math.min(0.25, elapsedSeconds);
  while (game.accumulator + 1e-10 >= FIXED_STEP && game.phase === 'playing' && !game.pendingReward) {
    game.accumulator -= FIXED_STEP;
    if (Math.abs(game.accumulator) < 1e-10) game.accumulator = 0;
    fixedUpdate(game, input);
  }
  if (game.phase !== 'playing' || game.pendingReward) game.accumulator = 0;
}
