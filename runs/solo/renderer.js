import { WIDTH, HEIGHT, WALL, GATE_TOP, GATE_BOTTOM } from './constants.js';
import { currentRoom, livingEnemies, exitLocked } from './state.js';

const COLORS = { melee: '#df8266', ranged: '#b799da', elite: '#efc078', boss: '#ee9876' };

function circle(ctx, x, y, radius, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function polygon(ctx, x, y, radius, sides, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = rotation + i / sides * Math.PI * 2;
    const px = x + Math.cos(angle) * radius; const py = y + Math.sin(angle) * radius;
    if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
function text(ctx, value, x, y, color = '#b4c6bd', size = 12, align = 'center') {
  ctx.fillStyle = color; ctx.font = `${size}px Arial`; ctx.textAlign = align; ctx.fillText(value, x, y);
}

function environment(ctx, run) {
  const room = currentRoom(run);
  ctx.fillStyle = '#101c23'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#192a30'; ctx.fillRect(WALL, WALL, WIDTH - WALL * 2, HEIGHT - WALL * 2);
  ctx.strokeStyle = '#23343a'; ctx.lineWidth = 1;
  for (let x = WALL; x < WIDTH - WALL; x += 48) {
    for (let y = WALL; y < HEIGHT - WALL; y += 48) {
      ctx.strokeRect(x, y, 48, 48);
      if ((x * 13 + y * 7 + run.seed) % 11 < 3) {
        ctx.fillStyle = '#29404744'; ctx.fillRect(x + 4, y + 4, 40, 40);
      }
    }
  }
  ctx.strokeStyle = '#607070'; ctx.lineWidth = 2; ctx.strokeRect(WALL, WALL, WIDTH - WALL * 2, HEIGHT - WALL * 2);
  for (const x of [110, WIDTH - 110]) for (const y of [100, HEIGHT - 100]) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 75);
    glow.addColorStop(0, '#e5aa492c'); glow.addColorStop(1, '#e5aa4900');
    ctx.fillStyle = glow; ctx.fillRect(x - 75, y - 75, 150, 150);
    ctx.fillStyle = '#a47649'; ctx.fillRect(x - 6, y - 8, 12, 22);
    polygon(ctx, x, y - 7, 9, 4, -Math.PI / 2); ctx.fillStyle = '#efc078'; ctx.fill();
  }
  for (const block of room.blocks) {
    const [x, y, w, h] = block;
    ctx.fillStyle = '#0c151daa'; ctx.fillRect(x + 8, y + 10, w, h);
    ctx.fillStyle = '#35444b'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#677276'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#425157'; ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    ctx.strokeStyle = '#2c3b41'; ctx.strokeRect(x + 14, y + 14, w - 28, h - 28);
  }
  const locked = exitLocked(run);
  for (const [x, exists, arrow] of [[WALL / 2, run.roomIndex > 0, '‹'], [WIDTH - WALL / 2, run.roomIndex < 4, '›']]) {
    if (!exists) continue;
    ctx.fillStyle = locked ? '#3d2d2b' : '#174139'; ctx.fillRect(x - 18, GATE_TOP, 36, GATE_BOTTOM - GATE_TOP);
    ctx.strokeStyle = locked ? '#d88065' : '#69d9c1'; ctx.lineWidth = 3; ctx.strokeRect(x - 17, GATE_TOP, 34, GATE_BOTTOM - GATE_TOP);
    if (locked) {
      for (let y = GATE_TOP + 9; y < GATE_BOTTOM; y += 18) { ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y + 12); ctx.stroke(); }
    } else text(ctx, arrow, x, HEIGHT / 2 + 15, '#a5efc7', 40);
  }
  text(ctx, room.name.toUpperCase(), WIDTH / 2, 80, '#869996', 13);
  text(ctx, room.layout, WIDTH / 2, 101, '#596f73', 10);
  if (room.type === 'start') {
    polygon(ctx, 270, 320, 48, 4); ctx.strokeStyle = '#ad996b'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'KEEP THE EMBER ALIVE', 490, 312, '#c7c9b1', 16);
    text(ctx, 'Move to the glowing east door →', 490, 340, '#96aba8', 12);
    text(ctx, 'Aim with your mouse · Hold Space or left click to fire', 490, 364, '#718a8c', 10);
  }
  if (room.cleared && room.type === 'combat' && !run.rewardPending) {
    text(ctx, 'CHAMBER CLEARED', WIDTH / 2, HEIGHT - 78, '#86cfb3', 13);
    text(ctx, 'Continue through the east door →', WIDTH / 2, HEIGHT - 59, '#759690', 11);
  }
}

function cues(ctx, run) {
  for (const hazard of run.hazards) {
    const warning = hazard.warning > 0;
    circle(ctx, hazard.x, hazard.y, hazard.radius, warning ? '#ed954824' : '#ffe1a4cc', warning ? '#efad68' : '#fff1b3', 3);
    if (warning) {
      circle(ctx, hazard.x, hazard.y, hazard.radius * (1 - hazard.warning / 1.4), null, '#f6c18b', 2);
      text(ctx, 'MOVE', hazard.x, hazard.y + 4, '#f7c795', 11);
    }
  }
  for (const e of livingEnemies(run)) {
    if (e.phase !== 'windup') continue;
    ctx.save();
    if (e.kind === 'melee') circle(ctx, e.target.x, e.target.y, 37, '#ed785b25', '#ed997b', 2);
    if (e.kind === 'ranged' || e.kind === 'elite') {
      ctx.setLineDash(e.kind === 'ranged' ? [7, 7] : []);
      ctx.strokeStyle = e.kind === 'ranged' ? '#c5a3ec' : '#efbf78'; ctx.lineWidth = e.kind === 'elite' ? 16 : 2;
      ctx.globalAlpha = e.kind === 'elite' ? .25 : .8;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.angle) * 360, e.y + Math.sin(e.angle) * 360); ctx.stroke();
      text(ctx, e.kind === 'elite' ? 'CHARGE' : 'AIMING', e.x, e.y - 40, COLORS[e.kind], 10);
    }
    if (e.kind === 'boss') {
      circle(ctx, e.x, e.y, 58 + Math.sin(run.time * 10) * 4, null, '#efbb86', 2);
      if (e.pattern % 2 === 1) {
        for (let i = 0; i < 12; i++) {
          const a = e.angle + i * Math.PI / 6;
          ctx.strokeStyle = '#edbc7877'; ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50); ctx.lineTo(e.x + Math.cos(a) * 130, e.y + Math.sin(a) * 130); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}

function enemies(ctx, run) {
  for (const e of livingEnemies(run)) {
    const color = e.flash > 0 ? '#ffffff' : COLORS[e.kind];
    circle(ctx, e.x + 3, e.y + 8, e.radius, '#0005');
    ctx.fillStyle = '#26323a'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    if (e.kind === 'melee') {
      circle(ctx, e.x, e.y, e.radius, '#402f30', color, 3);
      polygon(ctx, e.x - 10, e.y - 12, 7, 3, -.6); ctx.fillStyle = color; ctx.fill();
      polygon(ctx, e.x + 10, e.y - 12, 7, 3, -.4); ctx.fill();
    } else {
      polygon(ctx, e.x, e.y, e.radius, e.kind === 'elite' ? 3 : e.kind === 'boss' ? 8 : 4, -Math.PI / 2);
      ctx.fill(); ctx.stroke();
      if (e.kind === 'boss') {
        polygon(ctx, e.x, e.y, 25, 4, Math.PI / 4); ctx.stroke();
        circle(ctx, e.x, e.y, 11, '#e5a878');
      }
    }
    if (e.kind !== 'boss') {
      circle(ctx, e.x - 5, e.y - 1, 2.5, color); circle(ctx, e.x + 5, e.y - 1, 2.5, color);
      ctx.fillStyle = '#0c1519'; ctx.fillRect(e.x - 20, e.y + e.radius + 9, 40, 4);
      ctx.fillStyle = color; ctx.fillRect(e.x - 20, e.y + e.radius + 9, 40 * e.hp / e.maxHp, 4);
    } else {
      ctx.fillStyle = '#0b1418cc'; ctx.fillRect(350, 120, 420, 43);
      text(ctx, 'THE WARDEN', 560, 137, '#eac9a6', 12);
      ctx.fillStyle = '#603a32'; ctx.fillRect(366, 145, 388, 6);
      ctx.fillStyle = '#ed997b'; ctx.fillRect(366, 145, 388 * e.hp / e.maxHp, 6);
      text(ctx, e.phase === 'windup' ? e.pattern % 2 === 1 ? 'RADIAL VOLLEY · FIND A GAP' : 'EMBER FALL · LEAVE THE CIRCLES' : 'KEEP MOVING · AIM FOR THE CORE', 560, 181, '#dac6a6', 11);
    }
  }
}

function player(ctx, run) {
  const p = run.player;
  circle(ctx, p.x + 3, p.y + 9, 15, '#0006');
  if (p.invulnerable > 0) {
    circle(ctx, p.x, p.y, 25, '#71dbc11a', '#84e6d9', 2);
    text(ctx, 'SHIELD', p.x, p.y - 32, '#9df3dc', 9);
  }
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
  if (p.invulnerable > 0 && Math.floor(run.time * 16) % 2) ctx.globalAlpha = .45;
  ctx.fillStyle = '#509582'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-4, -12); ctx.lineTo(-4, 12); ctx.closePath(); ctx.fill();
  circle(ctx, 0, 0, 14, '#c4e9d2', '#78baaa', 2);
  ctx.fillStyle = '#112a30'; ctx.fillRect(3, -8, 8, 16);
  ctx.fillStyle = '#efc078'; ctx.fillRect(7, -3, 20, 6);
  if (p.attackFlash > 0) { polygon(ctx, 30, 0, 12, 4); ctx.fillStyle = '#fff1ae'; ctx.fill(); }
  ctx.restore();
}

function effects(ctx, run) {
  for (const shot of run.projectiles) {
    const angle = Math.atan2(shot.vy, shot.vx);
    ctx.strokeStyle = shot.owner === 'player' ? '#f4d29a' : '#ee8b86'; ctx.lineWidth = shot.radius;
    ctx.beginPath(); ctx.moveTo(shot.x - Math.cos(angle) * 14, shot.y - Math.sin(angle) * 14); ctx.lineTo(shot.x, shot.y); ctx.stroke();
    circle(ctx, shot.x, shot.y, shot.radius / 2, shot.owner === 'player' ? '#fff5cd' : '#fac3b3');
  }
  for (const effect of run.effects) {
    const progress = 1 - effect.life / effect.total;
    ctx.save(); ctx.globalAlpha = 1 - progress;
    if (effect.type === 'damage' || effect.type === 'strike') circle(ctx, effect.x, effect.y, 25 + progress * 45, null, '#fb8c78', 5);
    if (effect.type === 'hit' || effect.type === 'defeat') {
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const radius = 12 + progress * (effect.type === 'defeat' ? 50 : 22);
        ctx.fillStyle = effect.type === 'defeat' ? '#efbb76' : '#fff9dc';
        ctx.fillRect(effect.x + Math.cos(angle) * radius, effect.y + Math.sin(angle) * radius, effect.type === 'defeat' ? 6 : 3, effect.type === 'defeat' ? 6 : 3);
      }
    }
    ctx.restore();
  }
}

export function render(ctx, run) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  environment(ctx, run); cues(ctx, run); enemies(ctx, run); effects(ctx, run); player(ctx, run);
}
