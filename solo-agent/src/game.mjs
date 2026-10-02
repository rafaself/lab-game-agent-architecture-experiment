import { generateDungeon } from './dungeon.mjs';
import { applyUpgrade, createFreshPlayer, damagePlayer, UPGRADE_DEFINITIONS } from './rules.mjs';

const ENEMY_STATS = Object.freeze({
  melee: Object.freeze({ name: 'Ash Hound', health: 3, radius: 16, speed: 94, damage: 1 }),
  ranged: Object.freeze({ name: 'Gloom Acolyte', health: 2, radius: 15, speed: 72, damage: 1 }),
  elite: Object.freeze({ name: 'Ironbound', health: 7, radius: 22, speed: 84, damage: 2 }),
});

const PLAYER_ATTACK_RANGE = 102;
const DOOR_Y_MIN = 278;
const DOOR_Y_MAX = 362;

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function directionAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared === 0) return distance(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared));
  return distance(px, py, ax + t * abx, ay + t * aby);
}

function angleDifference(left, right) {
  return Math.atan2(Math.sin(left - right), Math.cos(left - right));
}

function makeEnemy(spec, index) {
  const stats = ENEMY_STATS[spec.type];
  return {
    ...spec,
    name: stats.name,
    radius: stats.radius,
    maxHealth: stats.health,
    health: stats.health,
    speed: stats.speed,
    damage: stats.damage,
    state: 'approach',
    timer: 0.35 + index * 0.22,
    cooldown: 0.4 + index * 0.25,
    aimAngle: 0,
    chargeAngle: 0,
    chargeTime: 0,
    hitFlash: 0,
    dead: false,
    deathTimer: 0,
  };
}

function makeBoss() {
  return {
    x: 704,
    y: 320,
    radius: 30,
    name: 'The Hollow Crown',
    health: 18,
    maxHealth: 18,
    phase: 'windup',
    pattern: 'charge',
    patternIndex: 0,
    timer: 1.05,
    angle: Math.PI,
    hitFlash: 0,
    dead: false,
  };
}

export class DungeonGame {
  constructor({ onChange = () => {}, onSound = () => {} } = {}) {
    this.onChange = onChange;
    this.onSound = onSound;
    this.mode = 'menu';
    this.seed = null;
    this.dungeon = null;
    this.roomIndex = 0;
    this.roomStates = [];
    this.player = createFreshPlayer();
    this.projectiles = [];
    this.effects = [];
    this.keys = new Set();
    this.aim = null;
    this.lastMoveAngle = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.elapsed = 0;
  }

  showMenu() {
    this.mode = 'menu';
    this.keys.clear();
    this.dungeon = null;
    this.roomStates = [];
    this.roomIndex = 0;
    this.player = createFreshPlayer();
    this.projectiles = [];
    this.effects = [];
    this.onChange();
  }

  startRun(seed) {
    this.seed = seed >>> 0;
    this.dungeon = generateDungeon(this.seed);
    this.roomIndex = 0;
    this.player = createFreshPlayer();
    this.roomStates = this.dungeon.rooms.map((room) => ({
      room,
      enemies: [],
      boss: null,
      initialized: false,
      cleared: room.type === 'start',
      rewardClaimed: false,
    }));
    this.projectiles = [];
    this.effects = [];
    this.keys.clear();
    this.aim = null;
    this.lastMoveAngle = 0;
    this.elapsed = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.mode = 'playing';
    this.ensureRoomInitialized();
    this.onChange();
  }

  get currentState() {
    return this.roomStates[this.roomIndex] ?? null;
  }

  get currentRoom() {
    return this.currentState?.room ?? null;
  }

  get currentBoss() {
    return this.currentState?.boss ?? null;
  }

  isDoorOpen(side) {
    const state = this.currentState;
    if (!state || this.mode === 'victory') return false;
    const hasNeighbor = side === 'left' ? this.roomIndex > 0 : this.roomIndex < this.roomStates.length - 1;
    return hasNeighbor && state.cleared;
  }

  setKey(key, pressed) {
    if (pressed) this.keys.add(key.toLowerCase());
    else this.keys.delete(key.toLowerCase());
  }

  setAim(x, y) {
    this.aim = { x, y };
  }

  ensureRoomInitialized() {
    const state = this.currentState;
    if (!state || state.initialized) return;
    state.initialized = true;
    if (state.room.type === 'combat') {
      state.enemies = state.room.encounter.map((spec, index) => makeEnemy(spec, index));
    } else if (state.room.type === 'boss') {
      state.boss = makeBoss();
      state.boss.angle = directionAngle(state.boss.x, state.boss.y, this.player.x, this.player.y);
    }
  }

  tryAttack() {
    if (this.mode !== 'playing' || this.player.cooldown > 0 || this.player.health <= 0) return false;
    const angle = this.aim
      ? directionAngle(this.player.x, this.player.y, this.aim.x, this.aim.y)
      : this.lastMoveAngle;
    this.player = {
      ...this.player,
      cooldown: this.player.attackCooldown,
      attackTimer: 0.2,
      attackAngle: angle,
    };
    this.onSound('attack');

    const state = this.currentState;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (this.attackHits(enemy.x, enemy.y, enemy.radius, angle)) this.hitEnemy(enemy);
    }
    if (state.boss && !state.boss.dead && this.attackHits(state.boss.x, state.boss.y, state.boss.radius, angle)) {
      this.hitBoss(state.boss);
    }
    this.checkRoomClear(state);
    this.onChange();
    return true;
  }

  attackHits(x, y, radius, angle) {
    const targetAngle = directionAngle(this.player.x, this.player.y, x, y);
    return distance(this.player.x, this.player.y, x, y) <= PLAYER_ATTACK_RANGE + radius
      && Math.abs(angleDifference(targetAngle, angle)) <= 0.92;
  }

  hitEnemy(enemy) {
    enemy.health = Math.max(0, enemy.health - this.player.damage);
    enemy.hitFlash = 0.16;
    const angle = directionAngle(this.player.x, this.player.y, enemy.x, enemy.y);
    enemy.x += Math.cos(angle) * 13;
    enemy.y += Math.sin(angle) * 13;
    this.effects.push({ type: 'hit', x: enemy.x, y: enemy.y, timer: 0.2, life: 0.2 });
    if (enemy.health === 0) {
      enemy.dead = true;
      enemy.deathTimer = 0.24;
      this.effects.push({ type: 'defeat', x: enemy.x, y: enemy.y, timer: 0.55, life: 0.55 });
      this.onSound('defeat');
    }
  }

  hitBoss(boss) {
    boss.health = Math.max(0, boss.health - this.player.damage);
    boss.hitFlash = 0.18;
    this.effects.push({ type: 'hit', x: boss.x, y: boss.y, timer: 0.2, life: 0.2 });
    if (boss.health === 0) {
      boss.dead = true;
      this.currentState.cleared = true;
      this.mode = 'victory';
      this.onSound('victory');
      this.onChange();
    }
  }

  checkRoomClear(state) {
    if (state?.room.type !== 'combat' || state.cleared) return;
    if (state.enemies.length === 0 || state.enemies.every((enemy) => enemy.dead)) {
      state.cleared = true;
      this.projectiles = [];
      if (!state.rewardClaimed) {
        this.mode = 'reward';
        this.onSound('reward');
      }
      this.onChange();
    }
  }

  chooseUpgrade(upgradeId) {
    if (this.mode !== 'reward') return false;
    const offered = this.currentRoom.offers;
    if (!offered.includes(upgradeId)) return false;
    this.player = applyUpgrade(this.player, upgradeId);
    this.currentState.rewardClaimed = true;
    this.mode = 'playing';
    this.toast = `${this.player.upgrades[upgradeId] > 1 ? 'Upgrade strengthened' : 'Upgrade gained'}: ${UPGRADE_DEFINITIONS[upgradeId].name}`;
    this.toastTimer = 1.8;
    this.onSound('reward');
    this.onChange();
    return true;
  }

  tick(deltaSeconds) {
    if (this.mode !== 'playing') return;
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.04);
    if (dt === 0) return;
    this.elapsed += dt;
    this.updatePlayer(dt);
    const state = this.currentState;
    if (state.room.type === 'combat') this.updateEnemies(state, dt);
    else if (state.room.type === 'boss') this.updateBoss(state.boss, dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    this.checkRoomClear(state);
  }

  updatePlayer(dt) {
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    this.player.attackTimer = Math.max(0, this.player.attackTimer - dt);
    this.player.invulnerability = Math.max(0, this.player.invulnerability - dt);

    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    const magnitude = Math.hypot(x, y);
    if (magnitude > 0) {
      x /= magnitude;
      y /= magnitude;
      this.lastMoveAngle = Math.atan2(y, x);
    }

    const state = this.currentState;
    const room = state.room;
    const layout = room.layout;
    let nextX = this.player.x + (x * this.player.speed + this.player.knockbackX) * dt;
    let nextY = this.player.y + (y * this.player.speed + this.player.knockbackY) * dt;
    this.player.knockbackX *= Math.max(0, 1 - dt * 8);
    this.player.knockbackY *= Math.max(0, 1 - dt * 8);
    nextY = Math.max(84, Math.min(556, nextY));

    const crossingDoor = nextY >= DOOR_Y_MIN && nextY <= DOOR_Y_MAX;
    if (nextX < 38) {
      if (crossingDoor && this.isDoorOpen('left')) {
        this.enterRoom(-1);
        return;
      }
      nextX = 56;
    } else if (nextX > 922) {
      if (crossingDoor && this.isDoorOpen('right')) {
        this.enterRoom(1);
        return;
      }
      nextX = 904;
    }

    const pillars = layout.pillars;
    if (!this.collidesWithPillar(nextX, this.player.y, this.player.radius, pillars)) this.player.x = nextX;
    if (!this.collidesWithPillar(this.player.x, nextY, this.player.radius, pillars)) this.player.y = nextY;
  }

  collidesWithPillar(x, y, radius, pillars) {
    return pillars.some((pillar) => distance(x, y, pillar.x * 960, pillar.y * 640) < radius + pillar.r);
  }

  moveActor(actor, dx, dy, radius, pillars) {
    const nextX = Math.max(78, Math.min(882, actor.x + dx));
    const nextY = Math.max(94, Math.min(546, actor.y + dy));
    if (!this.collidesWithPillar(nextX, actor.y, radius, pillars)) actor.x = nextX;
    if (!this.collidesWithPillar(actor.x, nextY, radius, pillars)) actor.y = nextY;
  }

  enterRoom(direction) {
    const nextIndex = this.roomIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.roomStates.length) return;
    this.roomIndex = nextIndex;
    this.player.x = direction > 0 ? 104 : 856;
    this.player.y = 320;
    this.projectiles = [];
    this.effects = [];
    this.ensureRoomInitialized();
    this.onChange();
  }

  updateEnemies(state, dt) {
    for (const enemy of state.enemies) {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      if (enemy.dead) {
        enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
        continue;
      }
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const range = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const pillars = state.room.layout.pillars;

      if (enemy.type === 'melee') {
        if (enemy.state === 'windup') {
          enemy.timer -= dt;
          if (enemy.timer <= 0) {
            if (distance(enemy.x, enemy.y, this.player.x, this.player.y) < 76) {
              this.damagePlayer(enemy.damage, enemy.x, enemy.y);
            }
            enemy.state = 'recovery';
            enemy.timer = 0.68;
          }
        } else if (enemy.state === 'recovery') {
          enemy.timer -= dt;
          if (enemy.timer <= 0) enemy.state = 'approach';
        } else if (range < 50 && enemy.cooldown <= 0) {
          enemy.state = 'windup';
          enemy.timer = 0.48;
          enemy.cooldown = 1.15;
        } else if (range > 43) {
          this.moveActor(enemy, Math.cos(angle) * enemy.speed * dt, Math.sin(angle) * enemy.speed * dt, enemy.radius, pillars);
        }
      } else if (enemy.type === 'ranged') {
        if (enemy.state === 'aiming') {
          enemy.timer -= dt;
          if (enemy.timer <= 0) {
            this.projectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(enemy.aimAngle) * 290,
              vy: Math.sin(enemy.aimAngle) * 290,
              radius: 8,
              damage: enemy.damage,
              owner: 'enemy',
              kind: 'bolt',
              life: 4,
            });
            enemy.state = 'approach';
            enemy.cooldown = 1.3;
            this.onSound('enemy');
          }
        } else if (range > 470) {
          this.moveActor(enemy, Math.cos(angle) * enemy.speed * dt, Math.sin(angle) * enemy.speed * dt, enemy.radius, pillars);
        } else if (range < 195) {
          this.moveActor(enemy, -Math.cos(angle) * enemy.speed * dt, -Math.sin(angle) * enemy.speed * dt, enemy.radius, pillars);
        } else if (enemy.cooldown <= 0) {
          enemy.state = 'aiming';
          enemy.timer = 0.72;
          enemy.aimAngle = angle;
        }
      } else if (enemy.type === 'elite') {
        if (enemy.state === 'chargeWindup') {
          enemy.timer -= dt;
          if (enemy.timer <= 0) {
            enemy.state = 'charging';
            enemy.chargeTime = 0.32;
            enemy.cooldown = 1.25;
          }
        } else if (enemy.state === 'charging') {
          const oldX = enemy.x;
          const oldY = enemy.y;
          const speed = 630;
          this.moveActor(enemy, Math.cos(enemy.chargeAngle) * speed * dt, Math.sin(enemy.chargeAngle) * speed * dt, enemy.radius, pillars);
          if (pointSegmentDistance(this.player.x, this.player.y, oldX, oldY, enemy.x, enemy.y) < this.player.radius + enemy.radius + 4) {
            this.damagePlayer(enemy.damage, enemy.x, enemy.y);
          }
          enemy.chargeTime -= dt;
          if (enemy.chargeTime <= 0) {
            enemy.state = 'recovery';
            enemy.timer = 0.72;
          }
        } else if (enemy.state === 'recovery') {
          enemy.timer -= dt;
          if (enemy.timer <= 0) enemy.state = 'approach';
        } else if (range < 365 && enemy.cooldown <= 0) {
          enemy.state = 'chargeWindup';
          enemy.timer = 0.7;
          enemy.chargeAngle = angle;
        } else if (range > 95) {
          this.moveActor(enemy, Math.cos(angle) * enemy.speed * dt, Math.sin(angle) * enemy.speed * dt, enemy.radius, pillars);
        }
      }
    }
    this.checkRoomClear(state);
  }

  updateBoss(boss, dt) {
    if (!boss || boss.dead) return;
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    boss.timer -= dt;
    const pillars = this.currentRoom.layout.pillars;

    if (boss.phase === 'windup' && boss.timer <= 0) {
      if (boss.pattern === 'charge') {
        boss.phase = 'charging';
        boss.timer = 0.42;
      } else {
        const count = 12;
        for (let index = 0; index < count; index += 1) {
          const angle = (Math.PI * 2 * index) / count;
          this.projectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * 220,
            vy: Math.sin(angle) * 220,
            radius: 8,
            damage: 1,
            owner: 'enemy',
            kind: 'crown-shard',
            life: 5,
          });
        }
        this.onSound('enemy');
        boss.phase = 'recovery';
        boss.timer = 0.9;
      }
    } else if (boss.phase === 'charging') {
      const oldX = boss.x;
      const oldY = boss.y;
      this.moveActor(boss, Math.cos(boss.angle) * 610 * dt, Math.sin(boss.angle) * 610 * dt, boss.radius, pillars);
      if (pointSegmentDistance(this.player.x, this.player.y, oldX, oldY, boss.x, boss.y) < this.player.radius + boss.radius + 8) {
        this.damagePlayer(2, boss.x, boss.y);
      }
      if (boss.timer <= 0) {
        boss.phase = 'recovery';
        boss.timer = 0.85;
      }
    } else if (boss.phase === 'recovery' && boss.timer <= 0) {
      boss.patternIndex += 1;
      boss.pattern = boss.patternIndex % 2 === 0 ? 'charge' : 'radial';
      boss.angle = directionAngle(boss.x, boss.y, this.player.x, this.player.y);
      boss.phase = 'windup';
      boss.timer = boss.pattern === 'charge' ? 1.0 : 1.15;
    }
  }

  updateProjectiles(dt) {
    const remaining = [];
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      if (projectile.life <= 0 || projectile.x < 20 || projectile.x > 940 || projectile.y < 66 || projectile.y > 574) continue;
      if (distance(projectile.x, projectile.y, this.player.x, this.player.y) < projectile.radius + this.player.radius) {
        this.damagePlayer(projectile.damage, projectile.x, projectile.y);
        continue;
      }
      remaining.push(projectile);
    }
    this.projectiles = remaining;
  }

  damagePlayer(amount, sourceX, sourceY) {
    const result = damagePlayer(this.player, amount);
    if (!result.tookDamage) return false;
    const angle = directionAngle(sourceX, sourceY, this.player.x, this.player.y);
    this.player = {
      ...result.player,
      knockbackX: Math.cos(angle) * 190,
      knockbackY: Math.sin(angle) * 190,
    };
    this.effects.push({ type: 'damage', x: this.player.x, y: this.player.y - 22, timer: 0.65, life: 0.65 });
    this.onSound('damage');
    if (this.player.health === 0) {
      this.mode = 'gameover';
      this.onSound('defeat');
      this.onChange();
    } else {
      this.onChange();
    }
    return true;
  }

  updateEffects(dt) {
    for (const effect of this.effects) effect.timer = Math.max(0, effect.timer - dt);
    this.effects = this.effects.filter((effect) => effect.timer > 0);
  }
}
