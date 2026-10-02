import { WIDTH, HEIGHT, WALL } from './constants.js';
import { currentRoom, damageEnemy, damagePlayer, emit, livingEnemies, movePlayer } from './state.js';
import { direction, distance, hitsBlock, moveBody } from './physics.js';

function shoot(run, owner, x, y, angle, damage, speed, radius = 7) {
  run.projectiles.push({ owner, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, damage, life: owner === 'player' ? .95 : 5 });
}

export function attack(run) {
  const p = run.player;
  if (run.state !== 'playing' || run.paused || run.rewardPending || p.cooldown > 0) return false;
  p.cooldown = p.cadence;
  p.attackFlash = .11;
  shoot(run, 'player', p.x + Math.cos(p.angle) * 21, p.y + Math.sin(p.angle) * 21, p.angle, p.damage, 730, 5);
  emit(run, 'attack');
  return true;
}

function targetPlayer(enemy, player) {
  enemy.target = { x: player.x, y: player.y };
  enemy.angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
}

function tickMelee(run, enemy, dt) {
  const p = run.player;
  if (enemy.phase === 'windup') {
    if (enemy.timer <= 0) {
      if (distance(p, enemy.target) < 37 + p.radius) damagePlayer(run, enemy.damage);
      run.effects.push({ type: 'strike', ...enemy.target, life: .25, total: .25 });
      enemy.phase = 'idle'; enemy.timer = .8;
      emit(run, 'enemyAttack');
    }
    return;
  }
  if (distance(enemy, p) < 63 && enemy.timer <= 0) {
    targetPlayer(enemy, p); enemy.phase = 'windup'; enemy.timer = .5;
  } else if (distance(enemy, p) > 37) {
    const dir = direction(p.x - enemy.x, p.y - enemy.y);
    moveBody(enemy, dir.x * enemy.speed * dt, dir.y * enemy.speed * dt, currentRoom(run).blocks);
  }
}

function tickRanged(run, enemy, dt) {
  const p = run.player;
  if (enemy.phase === 'windup') {
    if (enemy.timer <= 0) {
      shoot(run, 'enemy', enemy.x, enemy.y, enemy.angle, enemy.damage, 230);
      enemy.phase = 'idle'; enemy.timer = 1.6;
      emit(run, 'enemyAttack');
    }
    return;
  }
  if (enemy.timer <= 0) {
    targetPlayer(enemy, p); enemy.phase = 'windup'; enemy.timer = .9;
  } else {
    const d = distance(enemy, p);
    const dir = direction(p.x - enemy.x, p.y - enemy.y);
    const sign = d > 340 ? 1 : d < 190 ? -1 : 0;
    moveBody(enemy, dir.x * enemy.speed * dt * sign, dir.y * enemy.speed * dt * sign, currentRoom(run).blocks);
  }
}

function tickElite(run, enemy, dt) {
  const p = run.player;
  if (enemy.phase === 'windup') {
    if (enemy.timer <= 0) { enemy.phase = 'charge'; enemy.timer = .48; emit(run, 'enemyAttack'); }
    return;
  }
  if (enemy.phase === 'charge') {
    moveBody(enemy, Math.cos(enemy.angle) * 520 * dt, Math.sin(enemy.angle) * 520 * dt, currentRoom(run).blocks);
    if (distance(enemy, p) < enemy.radius + p.radius + 5) damagePlayer(run, enemy.damage);
    if (enemy.timer <= 0) { enemy.phase = 'idle'; enemy.timer = 1.7; }
    return;
  }
  if (enemy.timer <= 0) { targetPlayer(enemy, p); enemy.phase = 'windup'; enemy.timer = .95; }
  else if (distance(enemy, p) > 250) {
    const dir = direction(p.x - enemy.x, p.y - enemy.y);
    moveBody(enemy, dir.x * enemy.speed * dt, dir.y * enemy.speed * dt, currentRoom(run).blocks);
  }
}

function tickBoss(run, enemy, dt) {
  if (enemy.phase === 'windup') {
    if (enemy.timer <= 0) {
      if (enemy.pattern % 2 === 1) {
        const offset = enemy.angle;
        for (let i = 0; i < 12; i++) shoot(run, 'enemy', enemy.x, enemy.y, offset + i * Math.PI / 6, enemy.damage, 180, 9);
      }
      enemy.phase = 'idle'; enemy.timer = 1.9;
      emit(run, 'enemyAttack');
    }
    return;
  }
  if (enemy.timer <= 0) {
    enemy.pattern++;
    targetPlayer(enemy, run.player);
    enemy.phase = 'windup';
    enemy.timer = enemy.pattern % 2 === 0 ? 1.4 : 1.1;
    if (enemy.pattern % 2 === 0) {
      for (const [dx, dy] of [[0, 0], [110, -60], [-110, 60]]) {
        run.hazards.push({ x: Math.max(100, Math.min(WIDTH - 100, run.player.x + dx)), y: Math.max(100, Math.min(HEIGHT - 100, run.player.y + dy)), radius: 65, warning: 1.4, active: .3, damage: 22 });
      }
    }
  } else if (distance(enemy, run.player) > 300) {
    const dir = direction(run.player.x - enemy.x, run.player.y - enemy.y);
    moveBody(enemy, dir.x * enemy.speed * dt, dir.y * enemy.speed * dt, []);
  }
}

function tickProjectiles(run, dt) {
  const room = currentRoom(run);
  for (const shot of [...run.projectiles]) {
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    if (shot.x < WALL || shot.x > WIDTH - WALL || shot.y < WALL || shot.y > HEIGHT - WALL || room.blocks.some(b => hitsBlock(shot.x, shot.y, shot.radius, b))) shot.life = 0;
    if (shot.life <= 0) continue;
    if (shot.owner === 'player') {
      const hit = livingEnemies(run).find(e => distance(e, shot) < e.radius + shot.radius);
      if (hit) { shot.life = 0; damageEnemy(run, hit, shot.damage); }
    } else if (distance(run.player, shot) < run.player.radius + shot.radius) {
      shot.life = 0; damagePlayer(run, shot.damage);
    }
    if (run.state !== 'playing' || run.rewardPending) break;
  }
  run.projectiles = run.projectiles.filter(s => s.life > 0);
}

export function update(run, input, dt) {
  if (run.state !== 'playing' || run.paused || run.rewardPending) return;
  dt = Math.min(.05, Math.max(0, dt));
  run.time += dt;
  const p = run.player;
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.attackFlash = Math.max(0, (p.attackFlash || 0) - dt);
  run.noticeTimer = Math.max(0, run.noticeTimer - dt);
  if (input.aim) p.angle = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);
  movePlayer(run, input.x || 0, input.y || 0, dt);
  if (input.attack) attack(run);
  for (const e of livingEnemies(run)) {
    e.timer -= dt; e.flash = Math.max(0, e.flash - dt);
    if (e.kind === 'melee') tickMelee(run, e, dt);
    if (e.kind === 'ranged') tickRanged(run, e, dt);
    if (e.kind === 'elite') tickElite(run, e, dt);
    if (e.kind === 'boss') tickBoss(run, e, dt);
  }
  tickProjectiles(run, dt);
  if (run.state === 'playing' && !run.rewardPending) {
    for (const hazard of run.hazards) {
      hazard.warning -= dt;
      if (hazard.warning <= 0) {
        hazard.active -= dt;
        if (distance(p, hazard) < hazard.radius + p.radius) damagePlayer(run, hazard.damage);
      }
    }
    run.hazards = run.hazards.filter(h => h.warning > 0 || h.active > 0);
  }
  for (const effect of run.effects) effect.life -= dt;
  run.effects = run.effects.filter(e => e.life > 0);
}
