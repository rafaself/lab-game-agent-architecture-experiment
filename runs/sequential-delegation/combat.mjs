import { effect, emit } from './events.mjs';
import { findPath, lineBlocked, moveCircle, WORLD } from './geometry.mjs';

export const ENEMY_STATS = Object.freeze({
  melee: { health: 36, radius: 14, speed: 74, damage: 8 },
  ranged: { health: 30, radius: 15, speed: 50, damage: 10 },
  elite: { health: 70, radius: 21, speed: 64, damage: 15 },
  boss: { health: 240, radius: 34, speed: 44, damage: 16 },
});

export function createEnemy(specification) {
  const stats = ENEMY_STATS[specification.kind];
  return { ...specification, ...stats, maxHealth: stats.health,
    state: 'idle', cooldown: specification.initialCooldown, attack: null,
    damageFlash: 0, path: [], pathTimer: 0, patternIndex: 0 };
}

export function damagePlayer(game, amount, source = 'enemy') {
  const player = game.player;
  if (game.phase !== 'playing' || player.health <= 0 || player.invulnerable > 0 || !(amount > 0)) return false;
  player.health = Math.max(0, Math.min(player.maxHealth, player.health - amount));
  player.invulnerable = player.invulnerability;
  player.damageFlash = 0.2;
  emit(game, 'player-damaged', { amount, health: player.health, source, x: player.x, y: player.y });
  effect(game, 'player-damage', { x: player.x, y: player.y }, 0.32);
  if (player.health === 0) {
    game.phase = 'game-over';
    emit(game, 'game-over', { x: player.x, y: player.y });
    effect(game, 'player-defeat', { x: player.x, y: player.y }, 1.2);
  }
  return true;
}

export function damageEnemy(game, enemy, amount) {
  if (game.phase !== 'playing' || enemy.health <= 0 || !(amount > 0)) return false;
  enemy.health = Math.max(0, enemy.health - amount);
  enemy.damageFlash = 0.15;
  emit(game, 'enemy-damaged', { id: enemy.id, kind: enemy.kind, amount, x: enemy.x, y: enemy.y });
  effect(game, 'enemy-hit', { x: enemy.x, y: enemy.y }, 0.2);
  if (enemy.health === 0) {
    enemy.state = 'dead';
    enemy.attack = null;
    emit(game, 'enemy-defeated', { id: enemy.id, kind: enemy.kind, x: enemy.x, y: enemy.y });
    effect(game, 'enemy-defeat', { x: enemy.x, y: enemy.y, radius: enemy.radius }, 0.5);
  }
  return true;
}

export function playerAttack(game) {
  const player = game.player;
  if (game.phase !== 'playing' || game.pendingReward || player.cooldown > 0) return false;
  player.cooldown = player.attackCooldown;
  const room = game.rooms[game.roomIndex];
  const obstacles = game.dungeon.rooms[game.roomIndex].obstacles;
  emit(game, 'player-attack', { x: player.x, y: player.y, angle: player.aimAngle });
  effect(game, 'slash', { x: player.x, y: player.y, angle: player.aimAngle,
    range: player.attackRange, halfAngle: player.attackHalfAngle }, 0.16);
  for (const enemy of room.enemies) {
    if (enemy.health <= 0) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const difference = Math.atan2(Math.sin(angle - player.aimAngle), Math.cos(angle - player.aimAngle));
    if (distance <= player.attackRange + enemy.radius &&
        (distance < player.radius + enemy.radius || Math.abs(difference) <= player.attackHalfAngle) &&
        !lineBlocked(player.x, player.y, enemy.x, enemy.y, obstacles)) damageEnemy(game, enemy, player.damage);
  }
  return true;
}

function pursue(enemy, targetX, targetY, dt, obstacles) {
  enemy.pathTimer -= dt;
  if (enemy.pathTimer <= 0 || enemy.path.length === 0) {
    enemy.path = findPath(enemy.x, enemy.y, targetX, targetY, enemy.radius, obstacles);
    enemy.pathTimer = 0.3;
  }
  const point = enemy.path[0];
  if (!point) return;
  const dx = point.x - enemy.x;
  const dy = point.y - enemy.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 5) { enemy.path.shift(); return; }
  const step = Math.min(distance, enemy.speed * dt);
  moveCircle(enemy, dx / distance * step, dy / distance * step, obstacles);
}

function beginAttack(game, enemy, kind, duration, extra = {}) {
  const player = game.player;
  enemy.state = 'windup';
  enemy.attack = { kind, timer: duration, duration, x: enemy.x, y: enemy.y,
    targetX: player.x, targetY: player.y,
    angle: Math.atan2(player.y - enemy.y, player.x - enemy.x), ...extra };
  emit(game, 'enemy-telegraph', { id: enemy.id, kind: enemy.kind, pattern: kind,
    x: enemy.x, y: enemy.y, targetX: player.x, targetY: player.y });
}

function shoot(game, room, enemy, angle, speed = 235, damage = enemy.damage) {
  const distance = enemy.radius + 8;
  room.projectiles.push({ id: `projectile-${game.nextId++}`, owner: enemy.id,
    x: enemy.x + Math.cos(angle) * distance, y: enemy.y + Math.sin(angle) * distance,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    radius: 6, damage, remaining: 3.5, kind: enemy.kind === 'boss' ? 'warden-bolt' : 'bolt' });
}

function completeWindup(game, room, enemy) {
  const attack = enemy.attack;
  const player = game.player;
  emit(game, 'enemy-attack', { id: enemy.id, kind: enemy.kind, pattern: attack.kind, x: enemy.x, y: enemy.y });
  if (attack.kind === 'melee') {
    effect(game, 'melee-strike', { x: enemy.x, y: enemy.y, radius: 48 }, 0.22);
    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) <= 48 + player.radius) damagePlayer(game, enemy.damage, 'melee');
    enemy.cooldown = 1.25;
  } else if (attack.kind === 'shot') {
    shoot(game, room, enemy, attack.angle);
    enemy.cooldown = 1.55;
  } else if (attack.kind === 'charge') {
    enemy.state = 'charging';
    enemy.attack = { ...attack, timer: 0.65, duration: 0.65, hitPlayer: false };
    return;
  } else if (attack.kind === 'fan') {
    for (const offset of [-0.56, -0.28, 0, 0.28, 0.56]) shoot(game, room, enemy, attack.angle + offset, 195);
    enemy.cooldown = 1.45;
  } else if (attack.kind === 'nova') {
    enemy.cooldown = 1.7;
  }
  enemy.state = 'idle';
  enemy.attack = null;
}

function tickEnemy(game, room, enemy, dt, obstacles) {
  if (enemy.health <= 0) return;
  enemy.damageFlash = Math.max(0, enemy.damageFlash - dt);
  enemy.cooldown = Math.max(0, enemy.cooldown - dt);
  const player = game.player;
  if (enemy.state === 'windup') {
    enemy.attack.timer -= dt;
    if (enemy.attack.timer <= 1e-9) completeWindup(game, room, enemy);
    return;
  }
  if (enemy.state === 'charging') {
    const attack = enemy.attack;
    const x = enemy.x;
    const y = enemy.y;
    moveCircle(enemy, Math.cos(attack.angle) * 340 * dt, Math.sin(attack.angle) * 340 * dt, obstacles);
    attack.timer -= dt;
    if (!attack.hitPlayer && Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.radius + player.radius + 5) {
      attack.hitPlayer = damagePlayer(game, enemy.damage, 'elite-charge');
    }
    if (attack.timer <= 0 || Math.hypot(enemy.x - x, enemy.y - y) < 340 * dt * 0.4) {
      enemy.state = 'idle'; enemy.attack = null; enemy.cooldown = 1.8;
    }
    return;
  }
  const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  if (enemy.kind === 'melee') {
    if (distance < 54 && enemy.cooldown <= 0) beginAttack(game, enemy, 'melee', 0.48, { radius: 48 });
    else if (distance > 38) pursue(enemy, player.x, player.y, dt, obstacles);
  } else if (enemy.kind === 'ranged') {
    if (distance < 420 && enemy.cooldown <= 0 && !lineBlocked(enemy.x, enemy.y, player.x, player.y, obstacles)) {
      beginAttack(game, enemy, 'shot', 0.85);
    } else if (distance > 300) pursue(enemy, player.x, player.y, dt, obstacles);
    else if (distance < 180) {
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      pursue(enemy, Math.max(55, Math.min(905, enemy.x + Math.cos(angle) * 110)),
        Math.max(55, Math.min(545, enemy.y + Math.sin(angle) * 110)), dt, obstacles);
    }
  } else if (enemy.kind === 'elite') {
    if (distance < 320 && enemy.cooldown <= 0) beginAttack(game, enemy, 'charge', 1.0, { range: 221 });
    else if (distance > 110) pursue(enemy, player.x, player.y, dt, obstacles);
  } else if (enemy.kind === 'boss') {
    if (enemy.cooldown <= 0) {
      const pattern = enemy.patternIndex++ % 2 === 0 ? 'fan' : 'nova';
      beginAttack(game, enemy, pattern, pattern === 'fan' ? 1.0 : 1.25);
      if (pattern === 'nova') {
        for (const offset of [{ x: 0, y: 0 }, { x: -145, y: 110 }, { x: 145, y: -110 }]) {
          room.hazards.push({ id: `hazard-${game.nextId++}`, kind: 'nova', owner: enemy.id,
            x: Math.max(115, Math.min(845, player.x + offset.x)),
            y: Math.max(110, Math.min(490, player.y + offset.y)), radius: 78,
            timer: 1.25, duration: 1.25, active: 0.3, damage: enemy.damage, hitPlayer: false });
        }
      }
    } else if (distance > 250) pursue(enemy, player.x, player.y, dt, obstacles);
  }
}

function tickProjectiles(game, room, dt, obstacles) {
  for (const projectile of room.projectiles) {
    const oldX = projectile.x;
    const oldY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.remaining -= dt;
    if (lineBlocked(oldX, oldY, projectile.x, projectile.y, obstacles, projectile.radius) ||
        projectile.x < WORLD.wall || projectile.x > WORLD.width - WORLD.wall ||
        projectile.y < WORLD.wall || projectile.y > WORLD.height - WORLD.wall) projectile.remaining = 0;
    if (projectile.remaining > 0 && Math.hypot(game.player.x - projectile.x, game.player.y - projectile.y) <
        game.player.radius + projectile.radius) {
      damagePlayer(game, projectile.damage, projectile.kind);
      projectile.remaining = 0;
    }
  }
  room.projectiles = room.projectiles.filter(projectile => projectile.remaining > 0);
}

function tickHazards(game, room, dt) {
  for (const hazard of room.hazards) {
    if (hazard.timer > 0) {
      hazard.timer -= dt;
      if (hazard.timer <= 1e-9) {
        hazard.timer = 0;
        emit(game, 'hazard-exploded', { x: hazard.x, y: hazard.y, radius: hazard.radius });
        effect(game, 'nova-explosion', { x: hazard.x, y: hazard.y, radius: hazard.radius }, 0.3);
      }
    } else hazard.active -= dt;
    if (hazard.timer <= 0 && !hazard.hitPlayer &&
        Math.hypot(game.player.x - hazard.x, game.player.y - hazard.y) < hazard.radius + game.player.radius) {
      hazard.hitPlayer = damagePlayer(game, hazard.damage, 'boss-nova');
    }
  }
  room.hazards = room.hazards.filter(hazard => hazard.timer > 0 || hazard.active > 0);
}

export function tickCombat(game, dt) {
  const room = game.rooms[game.roomIndex];
  const obstacles = game.dungeon.rooms[game.roomIndex].obstacles;
  for (const enemy of room.enemies) {
    if (game.phase !== 'playing') break;
    tickEnemy(game, room, enemy, dt, obstacles);
  }
  if (game.phase !== 'playing') return;
  tickProjectiles(game, room, dt, obstacles);
  if (game.phase === 'playing') tickHazards(game, room, dt);
}
