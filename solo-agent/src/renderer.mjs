const COLORS = Object.freeze({
  melee: '#f07869',
  ranged: '#b99ae9',
  elite: '#e9a261',
  boss: '#e8c66f',
});

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    this.ratio = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(960 * this.ratio);
    this.canvas.height = Math.round(640 * this.ratio);
    this.context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
  }

  draw(game) {
    const ctx = this.context;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.clearRect(0, 0, 960, 640);
    const room = game.currentRoom;
    this.drawRoom(ctx, room, game);
    if (room) {
      const state = game.currentState;
      for (const projectile of game.projectiles) this.drawProjectile(ctx, projectile);
      for (const enemy of state.enemies) this.drawEnemy(ctx, enemy);
      if (state.boss) this.drawBoss(ctx, state.boss);
      this.drawEffects(ctx, game.effects);
      this.drawPlayer(ctx, game.player);
      if (state.boss) this.drawBossHealth(ctx, state.boss);
      this.drawToast(ctx, game);
    } else {
      this.drawMenuMotes(ctx);
    }
  }

  drawRoom(ctx, room, game) {
    const backdrop = ctx.createLinearGradient(0, 0, 960, 640);
    backdrop.addColorStop(0, '#121d26');
    backdrop.addColorStop(1, '#0c131b');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, 960, 640);

    ctx.fillStyle = '#141e27';
    ctx.fillRect(35, 50, 890, 540);
    ctx.fillStyle = '#1d2931';
    ctx.fillRect(54, 73, 852, 494);

    const roomHue = room?.type === 'boss' ? '#332c24' : room?.type === 'start' ? '#202c2d' : '#1e2930';
    ctx.fillStyle = roomHue;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(65, 84, 830, 472);
    ctx.globalAlpha = 1;

    for (let x = 67; x <= 893; x += 62) {
      ctx.strokeStyle = 'rgba(173, 191, 194, 0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 83);
      ctx.lineTo(x, 557);
      ctx.stroke();
    }
    for (let y = 88; y <= 553; y += 48) {
      ctx.strokeStyle = 'rgba(173, 191, 194, 0.045)';
      ctx.beginPath();
      ctx.moveTo(65, y);
      ctx.lineTo(895, y);
      ctx.stroke();
    }

    this.drawFloorMarkings(ctx, room);
    if (room?.layout?.pillars) {
      for (const pillar of room.layout.pillars) this.drawPillar(ctx, pillar);
    }
    this.drawWalls(ctx, game);
    if (room) {
      ctx.textAlign = 'center';
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.fillStyle = 'rgba(210, 221, 218, .5)';
      ctx.fillText(room.layout.name.toUpperCase(), 480, 544);
      const state = game.currentState;
      const cleared = state?.cleared;
      const label = room.type === 'start' ? 'SAFE ROOM' : room.type === 'boss' ? 'BOSS ENCOUNTER' : cleared ? 'CHAMBER CLEARED' : 'HOSTILES REMAIN';
      ctx.font = '500 10px "DM Mono", monospace';
      ctx.fillStyle = cleared ? '#83d5b7' : '#eea080';
      ctx.fillText(label, 480, 102);
      ctx.textAlign = 'left';
    }
  }

  drawFloorMarkings(ctx, room) {
    const variant = room?.index ?? 0;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = room?.type === 'boss' ? '#ddbd75' : '#86aaa1';
    ctx.lineWidth = 1;
    if (variant % 3 === 0) {
      ctx.beginPath();
      ctx.arc(480, 320, 118, 0.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(480, 320, 128, Math.PI * 1.05, Math.PI * 1.92);
      ctx.stroke();
    } else if (variant % 3 === 1) {
      for (const x of [196, 764]) {
        ctx.beginPath();
        ctx.arc(x, 320, 58, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(190, 180);
      ctx.lineTo(770, 460);
      ctx.moveTo(770, 180);
      ctx.lineTo(190, 460);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPillar(ctx, pillar) {
    const x = pillar.x * 960;
    const y = pillar.y * 640;
    const radius = pillar.r;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, .26)';
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 9, radius + 8, radius * .72 + 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const stone = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    stone.addColorStop(0, '#516068');
    stone.addColorStop(.3, '#34434a');
    stone.addColorStop(1, '#1a282e');
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * .78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(191, 204, 194, .24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - 3, radius - 4, radius * .65, 0, Math.PI * 1.06, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = 'rgba(216, 194, 134, .18)';
    ctx.beginPath();
    ctx.arc(x, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawWalls(ctx, game) {
    ctx.fillStyle = '#19252d';
    ctx.fillRect(35, 50, 890, 22);
    ctx.fillRect(35, 568, 890, 22);
    ctx.fillRect(35, 50, 20, 540);
    ctx.fillRect(905, 50, 20, 540);
    ctx.strokeStyle = 'rgba(171, 190, 190, .3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 61, 870, 518);

    for (const side of ['left', 'right']) {
      const open = game.isDoorOpen(side);
      const x = side === 'left' ? 44 : 916;
      ctx.save();
      if (open) {
        const glow = ctx.createRadialGradient(x, 320, 3, x, 320, 57);
        glow.addColorStop(0, 'rgba(123, 221, 185, .48)');
        glow.addColorStop(1, 'rgba(123, 221, 185, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 54, 258, 108, 124);
        ctx.strokeStyle = '#8ce3be';
        ctx.shadowColor = '#6dd4ad';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 281);
        ctx.quadraticCurveTo(x + (side === 'left' ? -10 : 10), 320, x, 359);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#583a3d';
        ctx.fillRect(x - 11, 276, 22, 88);
        ctx.strokeStyle = '#c77d70';
        ctx.lineWidth = 3;
        for (let y = 284; y <= 357; y += 22) {
          ctx.beginPath();
          ctx.moveTo(x - 10, y);
          ctx.lineTo(x + 10, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawEnemy(ctx, enemy) {
    if (enemy.dead && Math.floor(enemy.deathTimer * 24) % 2 === 0) return;
    const color = COLORS[enemy.type];
    ctx.save();
    if (enemy.state === 'windup') this.drawWarningRing(ctx, enemy.x, enemy.y, 42, '#f18974', 0.4);
    if (enemy.state === 'aiming') this.drawAimLine(ctx, enemy.x, enemy.y, enemy.aimAngle, '#d7aaff', 210);
    if (enemy.state === 'chargeWindup') this.drawAimLine(ctx, enemy.x, enemy.y, enemy.chargeAngle, '#ff8c72', 280);
    if (enemy.state === 'charging') {
      ctx.strokeStyle = 'rgba(242, 128, 96, .42)';
      ctx.lineWidth = enemy.radius * 1.15;
      ctx.beginPath();
      ctx.moveTo(enemy.x - Math.cos(enemy.chargeAngle) * 52, enemy.y - Math.sin(enemy.chargeAngle) * 52);
      ctx.lineTo(enemy.x, enemy.y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, .32)';
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + enemy.radius * .7, enemy.radius * 1.05, enemy.radius * .55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.type === 'melee') this.drawMeleeShape(ctx, enemy, color);
    else if (enemy.type === 'ranged') this.drawRangedShape(ctx, enemy, color);
    else this.drawEliteShape(ctx, enemy, color);
    ctx.restore();
    this.drawEnemyHealth(ctx, enemy);
  }

  drawMeleeShape(ctx, enemy, color) {
    ctx.fillStyle = enemy.hitFlash > 0 ? '#fff4da' : color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4b2528';
    ctx.beginPath();
    ctx.moveTo(-8, -7); ctx.lineTo(-13, -18); ctx.lineTo(-1, -11);
    ctx.moveTo(8, -7); ctx.lineTo(13, -18); ctx.lineTo(1, -11);
    ctx.fill();
    ctx.fillStyle = '#f7d9bf';
    ctx.fillRect(-6, -2, 3, 3);
    ctx.fillRect(4, -2, 3, 3);
  }

  drawRangedShape(ctx, enemy, color) {
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = enemy.hitFlash > 0 ? '#fff4da' : color;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.strokeStyle = '#e2d1fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(11, -13); ctx.lineTo(20, 16);
    ctx.stroke();
    ctx.fillStyle = '#472d64';
    ctx.beginPath();
    ctx.arc(-2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEliteShape(ctx, enemy, color) {
    ctx.fillStyle = enemy.hitFlash > 0 ? '#fff4da' : color;
    ctx.beginPath();
    ctx.moveTo(-19, -11); ctx.lineTo(-12, -21); ctx.lineTo(9, -21);
    ctx.lineTo(20, -9); ctx.lineTo(17, 14); ctx.lineTo(0, 21); ctx.lineTo(-18, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#563e2c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(11, 0);
    ctx.stroke();
    ctx.fillStyle = '#fff0c5';
    ctx.fillRect(-7, -7, 4, 4);
    ctx.fillRect(4, -7, 4, 4);
  }

  drawEnemyHealth(ctx, enemy) {
    if (enemy.dead || enemy.health >= enemy.maxHealth) return;
    const width = enemy.radius * 2.3;
    const x = enemy.x - width / 2;
    const y = enemy.y - enemy.radius - 11;
    ctx.fillStyle = 'rgba(3, 7, 10, .78)';
    ctx.fillRect(x, y, width, 4);
    ctx.fillStyle = COLORS[enemy.type];
    ctx.fillRect(x, y, width * enemy.health / enemy.maxHealth, 4);
  }

  drawBoss(ctx, boss) {
    if (boss.dead) return;
    ctx.save();
    if (boss.phase === 'windup' && boss.pattern === 'charge') this.drawAimLine(ctx, boss.x, boss.y, boss.angle, '#f5d477', 390);
    if (boss.phase === 'windup' && boss.pattern === 'radial') {
      const pulse = 74 + (1.15 - boss.timer) * 76;
      this.drawWarningRing(ctx, boss.x, boss.y, pulse, '#f5d477', 0.7);
      ctx.strokeStyle = 'rgba(245, 212, 119, .35)';
      ctx.setLineDash([5, 9]);
      ctx.beginPath(); ctx.arc(boss.x, boss.y, 184, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (boss.phase === 'charging') this.drawAimLine(ctx, boss.x, boss.y, boss.angle + Math.PI, '#f5d477', 90);
    ctx.fillStyle = 'rgba(0, 0, 0, .35)';
    ctx.beginPath(); ctx.ellipse(boss.x, boss.y + 24, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(boss.x, boss.y);
    const color = boss.hitFlash > 0 ? '#fff7d4' : COLORS.boss;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-27, -9); ctx.lineTo(-23, -30); ctx.lineTo(-11, -19);
    ctx.lineTo(0, -38); ctx.lineTo(11, -19); ctx.lineTo(25, -31);
    ctx.lineTo(28, -4); ctx.lineTo(22, 24); ctx.lineTo(0, 33); ctx.lineTo(-22, 24);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#342b26';
    ctx.beginPath(); ctx.ellipse(0, 2, 15, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff1b7';
    ctx.fillRect(-9, -3, 5, 3); ctx.fillRect(4, -3, 5, 3);
    ctx.restore();
  }

  drawBossHealth(ctx, boss) {
    if (boss.dead) return;
    const x = 350;
    const y = 68;
    const width = 260;
    ctx.fillStyle = 'rgba(2, 5, 8, .78)';
    ctx.fillRect(x, y, width, 10);
    ctx.fillStyle = '#e8c66f';
    ctx.fillRect(x, y, width * boss.health / boss.maxHealth, 10);
    ctx.strokeStyle = 'rgba(238, 222, 175, .58)';
    ctx.strokeRect(x, y, width, 10);
    ctx.textAlign = 'center';
    ctx.font = '600 10px "DM Mono", monospace';
    ctx.fillStyle = '#f0dda0';
    ctx.fillText('THE HOLLOW CROWN', 480, 59);
    ctx.textAlign = 'left';
  }

  drawPlayer(ctx, player) {
    if (player.invulnerability > 0 && Math.floor(player.invulnerability * 18) % 2 === 0) return;
    ctx.save();
    if (player.attackTimer > 0) {
      const alpha = Math.min(1, player.attackTimer / 0.12);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#c3f3df';
      ctx.shadowColor = '#82e1bd';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 72, player.attackAngle - .78, player.attackAngle + .78);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, .4)';
    ctx.beginPath(); ctx.ellipse(player.x, player.y + 13, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.attackAngle + Math.PI / 2);
    const cloak = ctx.createLinearGradient(-15, -14, 14, 17);
    cloak.addColorStop(0, player.invulnerability > 0 ? '#ffe9c2' : '#9be2c5');
    cloak.addColorStop(1, '#377e71');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(0, -19); ctx.lineTo(16, 14); ctx.lineTo(0, 9); ctx.lineTo(-16, 14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ead8b3';
    ctx.beginPath(); ctx.arc(0, -5, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#253839';
    ctx.beginPath(); ctx.arc(0, -5, 4, 0, Math.PI * 2); ctx.fill();
    if (player.invulnerability > 0) {
      ctx.strokeStyle = 'rgba(229, 247, 220, .8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  drawProjectile(ctx, projectile) {
    ctx.save();
    ctx.fillStyle = projectile.kind === 'crown-shard' ? '#f2d785' : '#d5a7fa';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawEffects(ctx, effects) {
    for (const effect of effects) {
      const alpha = effect.timer / effect.life;
      ctx.save();
      if (effect.type === 'damage') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff8c7d';
        ctx.font = '800 16px Manrope, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OUCH', effect.x, effect.y - (1 - alpha) * 19);
      } else {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = effect.type === 'defeat' ? '#f2d785' : '#eff8d6';
        ctx.lineWidth = effect.type === 'defeat' ? 3 : 2;
        const radius = (1 - alpha) * (effect.type === 'defeat' ? 35 : 22);
        ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawWarningRing(ctx, x, y, radius, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = `${color}18`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  drawAimLine(ctx, x, y, angle, color, length) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = `${color}16`;
    ctx.globalAlpha = .6;
    ctx.setLineDash([9, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawToast(ctx, game) {
    if (game.toastTimer <= 0 || !game.toast) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '600 12px Manrope, sans-serif';
    const width = ctx.measureText(game.toast).width + 36;
    ctx.fillStyle = 'rgba(13, 31, 28, .9)';
    ctx.strokeStyle = 'rgba(132, 215, 187, .3)';
    ctx.beginPath(); ctx.roundRect(480 - width / 2, 510, width, 30, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6f3e6';
    ctx.fillText(game.toast, 480, 530);
    ctx.restore();
  }

  drawMenuMotes(ctx) {
    for (let index = 0; index < 32; index += 1) {
      const x = (index * 191 + 71) % 960;
      const y = (index * 113 + 29) % 640;
      const radius = index % 4 === 0 ? 2 : 1;
      ctx.fillStyle = `rgba(195, 211, 187, ${index % 3 === 0 ? .22 : .11})`;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
  }
}
