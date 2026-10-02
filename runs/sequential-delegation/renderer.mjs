import { currentRoom, isRoomLocked, WORLD } from './model.mjs';

const COLORS = { ink: '#e8e8dc', gold: '#e6ba71', teal: '#79d1bf', red: '#ee887b', violet: '#b598df' };
const TAU = Math.PI * 2;

export function warningGeometry(enemy) {
  const attack = enemy.attack;
  if (!attack || enemy.state !== 'windup') return null;
  return {
    kind: attack.kind, x: attack.x, y: attack.y, angle: attack.angle,
    targetX: attack.targetX, targetY: attack.targetY,
    progress: Math.max(0, Math.min(1, 1 - attack.timer / attack.duration)),
    radius: attack.radius ?? null, range: attack.range ?? null,
    ...(attack.kind === 'fan' ? { angles: [-0.56, -0.28, 0, 0.28, 0.56].map(offset => attack.angle + offset) } : {}),
  };
}

function circle(ctx, x, y, radius, fill, stroke = null, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function polygon(ctx, x, y, radius, sides, angle, fill, stroke) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = angle + i * TAU / sides;
    ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
}

function label(ctx, text, x, y, color = '#94a7af', size = 11, align = 'center') {
  ctx.fillStyle = color; ctx.font = `${size}px system-ui`; ctx.textAlign = align; ctx.fillText(text, x, y);
}

function line(ctx, x, y, endX, endY, color, width = 2) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function drawRoom(ctx, definition, locked, runtime) {
  ctx.fillStyle = '#172229'; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let y = 30; y < 575; y += 48) for (let x = 30; x < 935; x += 48) {
    ctx.fillStyle = (Math.floor(x / 48) + Math.floor(y / 48)) % 3 === 0 ? '#1b272e' : '#19252c';
    ctx.fillRect(x, y, 46, 46);
  }
  ctx.strokeStyle = '#27383f'; ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, 864, 504);
  circle(ctx, 480, 300, 137, null, '#29383c', 2);
  circle(ctx, 480, 300, 129, null, '#233238', 1);
  for (let i = 0; i < 8; i++) {
    const angle = i * TAU / 8;
    line(ctx, 480 + Math.cos(angle) * 132, 300 + Math.sin(angle) * 132,
      480 + Math.cos(angle) * 143, 300 + Math.sin(angle) * 143, '#39413e', 2);
  }
  ctx.fillStyle = '#0c151b';
  ctx.fillRect(0, 0, 960, 28); ctx.fillRect(0, 572, 960, 28);
  ctx.fillRect(0, 0, 28, 600); ctx.fillRect(932, 0, 28, 600);
  ctx.strokeStyle = '#445056'; ctx.lineWidth = 2; ctx.strokeRect(28, 28, 904, 544);
  for (const x of [92, 868]) for (const y of [76, 524]) {
    circle(ctx, x, y, 25, '#e6ba7109'); circle(ctx, x, y, 12, '#e6ba7115');
    polygon(ctx, x, y, 5, 4, Math.PI / 4, COLORS.gold, '#e6ba71');
  }
  for (const [side, destination] of [['west', definition.previous], ['east', definition.next]]) {
    if (destination === null) continue;
    const x = side === 'east' ? 932 : 0;
    ctx.fillStyle = locked ? '#392824' : '#2b4944'; ctx.fillRect(x, 236, 28, 128);
    ctx.strokeStyle = locked ? '#cd7865' : COLORS.teal; ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, 238, 24, 124);
    if (locked) for (let y = 249; y < 362; y += 19) line(ctx, x + 4, y, x + 24, y - 7, '#dc8f7b', 4);
    else { label(ctx, side === 'east' ? '›' : '‹', x + 14, 313, COLORS.teal, 36); }
    label(ctx, locked ? 'LOCKED' : side === 'east' ? 'ONWARD →' : '← RETURN', side === 'east' ? 876 : 85, 393,
      locked ? '#dc8f7b' : COLORS.teal, 10);
  }
  for (const obstacle of definition.obstacles) {
    ctx.fillStyle = '#080f1559'; ctx.fillRect(obstacle.x + 7, obstacle.y + 7, obstacle.width, obstacle.height);
    ctx.fillStyle = '#304048'; ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.strokeStyle = '#536169'; ctx.lineWidth = 2; ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = '#3c4c53'; ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, 5);
    for (let x = obstacle.x + 20; x < obstacle.x + obstacle.width; x += 34) line(ctx, x, obstacle.y + 11, x, obstacle.y + obstacle.height - 9, '#26363d');
  }
  if (definition.kind === 'start') {
    label(ctx, 'QUIET THRESHOLD', 480, 260, '#9baea8', 18);
    label(ctx, 'Follow the open east door to begin.', 480, 290, '#718c89', 13);
    line(ctx, 417, 318, 543, 318, '#78b8a4', 2);
    label(ctx, '→', 560, 327, COLORS.teal, 27);
  } else if (runtime.cleared) label(ctx, 'CHAMBER CLEARED · EAST DOOR OPEN', 480, 544, COLORS.teal, 12);
}

function drawWarnings(ctx, runtime) {
  for (const enemy of runtime.enemies) {
    const warning = warningGeometry(enemy);
    if (!warning || enemy.health <= 0 || warning.kind === 'nova') continue;
    ctx.save(); ctx.setLineDash([7, 5]);
    ctx.globalAlpha = 0.65 + warning.progress * 0.35;
    if (warning.kind === 'melee') {
      circle(ctx, warning.x, warning.y, warning.radius, '#e6ba7128', COLORS.gold, 2);
      ctx.setLineDash([]); ctx.beginPath(); ctx.arc(warning.x, warning.y, warning.radius, -Math.PI / 2, -Math.PI / 2 + TAU * warning.progress);
      ctx.lineWidth = 4; ctx.stroke();
    } else if (warning.kind === 'fan') {
      ctx.beginPath(); ctx.moveTo(warning.x, warning.y);
      ctx.arc(warning.x, warning.y, 330, warning.angle - 0.56, warning.angle + 0.56);
      ctx.closePath(); ctx.fillStyle = '#e6ba7113'; ctx.fill();
      for (const angle of warning.angles) line(ctx, warning.x, warning.y,
        warning.x + Math.cos(angle) * 390, warning.y + Math.sin(angle) * 390, COLORS.gold, 2);
      label(ctx, 'BOLT FAN', warning.x, warning.y - 65, COLORS.gold, 12);
    } else {
      const range = warning.kind === 'charge' ? warning.range : 600;
      const endX = warning.x + Math.cos(warning.angle) * range;
      const endY = warning.y + Math.sin(warning.angle) * range;
      if (warning.kind === 'charge') {
        ctx.setLineDash([]); line(ctx, warning.x, warning.y, endX, endY, '#e6ba7128', (enemy.radius + 20) * 2);
        ctx.setLineDash([7, 5]); label(ctx, 'CHARGE', warning.x, warning.y - 44, COLORS.gold, 11);
      }
      line(ctx, warning.x, warning.y, endX, endY, COLORS.gold, 2 + warning.progress * 2);
      circle(ctx, warning.targetX, warning.targetY, 9, null, COLORS.gold, 1);
    }
    ctx.restore();
  }
  for (const hazard of runtime.hazards) {
    const progress = 1 - Math.max(0, hazard.timer) / hazard.duration;
    circle(ctx, hazard.x, hazard.y, hazard.radius, hazard.timer > 0 ? '#ee887b22' : '#ffb06055', hazard.timer > 0 ? COLORS.gold : COLORS.red, 3);
    if (hazard.timer > 0) {
      ctx.save(); ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.radius, 0, TAU); ctx.clip();
      for (let x = hazard.x - 150; x < hazard.x + 150; x += 17) line(ctx, x, hazard.y - 100, x + 180, hazard.y + 100, '#e6ba7133', 2);
      ctx.restore(); ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.radius - 5, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
      ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 5; ctx.stroke();
      label(ctx, 'MOVE', hazard.x, hazard.y + 5, COLORS.gold, 13);
    }
  }
}

function drawEnemy(ctx, enemy) {
  if (enemy.health <= 0) return;
  const { x, y, radius, kind } = enemy;
  circle(ctx, x + 2, y + 5, radius + 1, '#050b1055');
  const flashing = enemy.damageFlash > 0;
  if (kind === 'melee') {
    polygon(ctx, x, y, radius + 2, 3, -Math.PI / 2, flashing ? '#fff5d8' : '#a9524b', '#f6a58a');
    line(ctx, x - 5, y + 2, x + 5, y + 2, '#291c25', 3);
  } else if (kind === 'ranged') {
    polygon(ctx, x, y, radius + 2, 4, 0, flashing ? '#fff5d8' : '#775b9e', COLORS.violet);
    circle(ctx, x, y, 5, '#211c34', '#dfc4ff', 2);
    ctx.beginPath(); ctx.arc(x, y, radius + 5, -1.1, 1.1); ctx.strokeStyle = COLORS.violet; ctx.lineWidth = 2; ctx.stroke();
  } else if (kind === 'elite') {
    polygon(ctx, x, y, radius + 2, 6, 0, flashing ? '#fff5d8' : '#805039', COLORS.gold);
    polygon(ctx, x, y, radius - 7, 4, Math.PI / 4, '#3b2b30', '#e3a56c');
    line(ctx, x - 13, y - 14, x - 21, y - 26, COLORS.gold, 4);
    line(ctx, x + 13, y - 14, x + 21, y - 26, COLORS.gold, 4);
    if (enemy.state === 'charging') line(ctx, x, y, x - Math.cos(enemy.attack.angle) * 52, y - Math.sin(enemy.attack.angle) * 52, '#efb26777', 12);
  } else {
    polygon(ctx, x, y, radius + 4, 6, -Math.PI / 2, flashing ? '#fff5d8' : '#69495c', '#daae90');
    polygon(ctx, x, y + 2, radius - 11, 4, Math.PI / 4, '#29202e', COLORS.gold);
    line(ctx, x - 22, y - 22, x - 33, y - 47, COLORS.gold, 5);
    line(ctx, x + 22, y - 22, x + 33, y - 47, COLORS.gold, 5);
    line(ctx, x - 9, y - 3, x + 9, y - 3, '#f1cfa1', 3);
  }
  const barWidth = kind === 'boss' ? 74 : kind === 'elite' ? 48 : 32;
  const barY = y + radius + 10;
  ctx.fillStyle = '#0a1116'; ctx.fillRect(x - barWidth / 2, barY, barWidth, 4);
  ctx.fillStyle = COLORS.red; ctx.fillRect(x - barWidth / 2, barY, barWidth * enemy.health / enemy.maxHealth, 4);
}

function drawPlayer(ctx, player, time) {
  if (player.health <= 0) return;
  const { x, y, radius, aimAngle } = player;
  circle(ctx, x, y + 5, radius + 3, '#050b1077');
  if (player.invulnerable > 0) {
    ctx.save(); ctx.setLineDash([5, 4]); circle(ctx, x, y, radius + 9, '#79d1bf12', '#a9ecdf', 2); ctx.restore();
    ctx.globalAlpha = 0.65 + 0.35 * Math.abs(Math.sin(time * 22));
  }
  circle(ctx, x, y, radius, player.damageFlash > 0 ? '#ffb1a0' : '#417a73', COLORS.teal, 2);
  polygon(ctx, x, y - 2, radius - 5, 3, aimAngle, '#e6ebe1', '#9bcec0');
  const handX = x + Math.cos(aimAngle) * 14;
  const handY = y + Math.sin(aimAngle) * 14;
  line(ctx, handX, handY, x + Math.cos(aimAngle) * 36, y + Math.sin(aimAngle) * 36, '#e8e8dc', 3);
  circle(ctx, handX, handY, 3, COLORS.gold);
  ctx.globalAlpha = 1;
}

function drawEffects(ctx, effects) {
  for (const effect of effects) {
    const progress = 1 - effect.remaining / effect.duration;
    ctx.save(); ctx.globalAlpha = Math.max(0.1, 1 - progress);
    if (effect.kind === 'slash') {
      ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.arc(effect.x, effect.y, effect.range, effect.angle - effect.halfAngle, effect.angle + effect.halfAngle); ctx.closePath();
      ctx.fillStyle = '#abf2df24'; ctx.fill();
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.range, effect.angle - effect.halfAngle, effect.angle + effect.halfAngle);
      ctx.strokeStyle = '#d2fff0'; ctx.lineWidth = 6 * (1 - progress) + 1; ctx.stroke();
    } else if (effect.kind.includes('defeat')) {
      const radius = (effect.radius || 22) + progress * 45;
      for (let i = 0; i < 10; i++) {
        const a = i * TAU / 10;
        line(ctx, effect.x + Math.cos(a) * radius * 0.5, effect.y + Math.sin(a) * radius * 0.5,
          effect.x + Math.cos(a) * radius, effect.y + Math.sin(a) * radius, effect.kind === 'player-defeat' ? COLORS.red : COLORS.gold, 3);
      }
      circle(ctx, effect.x, effect.y, radius * 0.7, null, COLORS.ink, 2);
    } else {
      const radius = effect.radius || 14 + progress * 23;
      const color = effect.kind === 'enemy-hit' ? COLORS.ink : COLORS.red;
      circle(ctx, effect.x, effect.y, radius, effect.kind === 'nova-explosion' ? '#f5b47655' : null, color, 3);
    }
    ctx.restore();
  }
}

export function renderGame(ctx, game, pointer = null) {
  const { definition, runtime } = currentRoom(game);
  ctx.save(); drawRoom(ctx, definition, isRoomLocked(game), runtime);
  drawWarnings(ctx, runtime);
  for (const projectile of runtime.projectiles) {
    const angle = Math.atan2(projectile.vy, projectile.vx);
    line(ctx, projectile.x, projectile.y, projectile.x - Math.cos(angle) * 17, projectile.y - Math.sin(angle) * 17, '#e6ba7177', 5);
    circle(ctx, projectile.x, projectile.y, projectile.radius, COLORS.gold, '#fff4d9', 1);
  }
  for (const enemy of runtime.enemies) drawEnemy(ctx, enemy);
  drawPlayer(ctx, game.player, game.time); drawEffects(ctx, game.effects);
  if (pointer && game.phase === 'playing' && !game.pendingReward) {
    circle(ctx, pointer.x, pointer.y, 6, null, '#c0ded399');
    line(ctx, pointer.x - 10, pointer.y, pointer.x - 4, pointer.y, '#c0ded3', 1);
    line(ctx, pointer.x + 4, pointer.y, pointer.x + 10, pointer.y, '#c0ded3', 1);
  }
  const boss = runtime.enemies.find(enemy => enemy.kind === 'boss' && enemy.health > 0);
  if (boss) {
    ctx.fillStyle = '#0c151bd9'; ctx.fillRect(290, 43, 380, 48);
    label(ctx, 'WARDEN OF THE GATE', 480, 62, COLORS.gold, 12);
    ctx.fillStyle = '#3f333c'; ctx.fillRect(308, 74, 344, 6);
    ctx.fillStyle = '#d19382'; ctx.fillRect(308, 74, 344 * boss.health / boss.maxHealth, 6);
    label(ctx, `${Math.ceil(boss.health)} / ${boss.maxHealth}`, 681, 79, COLORS.ink, 10, 'left');
  }
  if (game.player.damageFlash > 0) { ctx.strokeStyle = '#ef887b99'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, 948, 588); }
  ctx.restore();
}
