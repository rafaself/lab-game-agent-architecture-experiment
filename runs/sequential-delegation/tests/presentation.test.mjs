import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput, pointerToWorld } from '../input.mjs';
import { createAudio } from '../audio.mjs';
import { createFrameDriver } from '../presentation.mjs';
import { warningGeometry, renderGame } from '../renderer.mjs';
import { createGame, startRun, WORLD } from '../model.mjs';
import { hudData } from '../ui.mjs';

class Surface {
  listeners = new Map();
  focused = false;
  addEventListener(name, callback) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(callback); }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  dispatch(name, details = {}) {
    const event = { target: this, preventDefault() { this.prevented = true; }, ...details };
    this.listeners.get(name)?.forEach(callback => callback(event)); return event;
  }
  getBoundingClientRect() { return { left: 30, top: 50, width: 480, height: 300 }; }
  focus() { this.focused = true; }
}

function inputFixture() {
  const target = new Surface(); const canvas = new Surface();
  return { target, canvas, input: createInput(canvas, WORLD, target) };
}

test('pointer coordinates scale from the displayed canvas and reject outside positions', () => {
  const bounds = { left: 30, top: 50, width: 480, height: 300 };
  assert.deepEqual(pointerToWorld({ clientX: 270, clientY: 200 }, bounds, WORLD), { x: 480, y: 300 });
  assert.equal(pointerToWorld({ clientX: 29, clientY: 200 }, bounds, WORLD), null);
  assert.equal(pointerToWorld({ clientX: 270, clientY: 200 }, { ...bounds, width: 0 }, WORLD), null);
});

test('WASD and arrows share model inputs; Space and primary click hold and release attacks', () => {
  const { target, canvas, input } = inputFixture(); input.setEnabled(true);
  target.dispatch('keydown', { code: 'KeyD' }); target.dispatch('keydown', { code: 'ArrowUp' });
  target.dispatch('keydown', { code: 'Space' });
  assert.deepEqual(input.sample(), { moveX: 1, moveY: -1, attack: true });
  target.dispatch('keyup', { code: 'Space' }); assert.equal(input.sample().attack, false);
  canvas.dispatch('pointerdown', { button: 0, clientX: 270, clientY: 200 });
  assert.equal(input.sample().attack, true); assert.equal(input.sample().aimX, 480); assert.equal(canvas.focused, true);
  target.dispatch('pointerup', { button: 0 }); assert.equal(input.sample().attack, false);
  target.dispatch('keyup', { code: 'KeyD' }); target.dispatch('keyup', { code: 'ArrowUp' });
  assert.equal(input.sample().moveX, 0); assert.equal(input.sample().moveY, 0);
  input.destroy();
});

test('blur, pointer cancellation, and screen disable clear held input; form controls retain keys', () => {
  const { target, canvas, input } = inputFixture(); input.setEnabled(true);
  for (const release of ['blur', 'pointercancel']) {
    target.dispatch('keydown', { code: 'KeyW' }); canvas.dispatch('pointerdown', { button: 0, clientX: 270, clientY: 200 });
    target.dispatch(release); assert.equal(input.sample().moveY, 0); assert.equal(input.sample().attack, false);
  }
  target.dispatch('keydown', { code: 'Space' }); input.setEnabled(false); assert.deepEqual(input.sample(), {});
  input.setEnabled(true); assert.equal(input.sample().attack, false);
  const event = target.dispatch('keydown', { code: 'KeyW', target: { tagName: 'INPUT' } });
  assert.equal(event.prevented, undefined); assert.equal(input.sample().moveY, 0);
  input.destroy();
});

test('real model normalization also applies to keyboard input sampled by the presentation', () => {
  function distance(diagonal) {
    const game = createGame(); startRun(game); const { target, input } = inputFixture(); input.setEnabled(true);
    target.dispatch('keydown', { code: 'KeyD' }); if (diagonal) target.dispatch('keydown', { code: 'KeyS' });
    const start = { x: game.player.x, y: game.player.y };
    const drive = createFrameDriver(game, { input, audio: { consume() {} }, ui: { update() {} }, render() {} });
    drive(0.2, 200); input.destroy(); return Math.hypot(game.player.x - start.x, game.player.y - start.y);
  }
  assert.ok(Math.abs(distance(false) - distance(true)) < 1e-8);
});

test('frame driver drains each queued event once and releases state on a screen transition', () => {
  const game = createGame(); const { input, target } = inputFixture(); const consumed = [];
  const drive = createFrameDriver(game, { input, audio: { consume(events) { consumed.push(...events); } }, ui: { update() {} }, render() {} });
  drive(0, 0); startRun(game); drive(0, 10); drive(0, 20);
  assert.deepEqual(consumed.map(event => event.type), ['run-started']); assert.equal(game.events.length, 0);
  target.dispatch('keydown', { code: 'Space' });
  game.phase = 'game-over'; drive(0, 30); startRun(game); drive(0, 40);
  assert.equal(input.sample().attack, false); input.destroy();
});

test('HUD reads live health, effects, hostile locks, and distinct protection states', () => {
  const game = createGame(); startRun(game);
  assert.equal(hudData(game).status, 'SANCTUARY · EXIT OPEN');
  game.roomIndex = 1; game.player.invulnerable = 0.5; assert.match(hudData(game).status, /HOSTILES · LOCKED/);
  assert.match(hudData(game).protection, /Protected/);
  game.player.damageFlash = 0.1; assert.match(hudData(game).protection, /Hit!/);
  game.player.health = 0; assert.equal(hudData(game).protection, 'Defeated');
});

test('warning extraction preserves fixed targets, actual ranges, and five boss fan directions', () => {
  const enemy = { state: 'windup', attack: { kind: 'charge', x: 500, y: 300, angle: 0.2, targetX: 250, targetY: 200, range: 221, timer: 0.5, duration: 1 } };
  const warning = warningGeometry(enemy);
  assert.equal(warning.range, 221); assert.equal(warning.progress, 0.5); assert.equal(warning.targetX, 250);
  assert.equal(enemy.attack.timer, 0.5);
  enemy.attack.kind = 'fan'; const fan = warningGeometry(enemy);
  assert.equal(fan.angles.length, 5); assert.equal(fan.angles[2], 0.2);
  enemy.state = 'idle'; assert.equal(warningGeometry(enemy), null);
});

test('renderer draws actual nova circles and all archetype/effect fixtures without altering state', () => {
  const game = createGame(); startRun(game); game.roomIndex = 4;
  const runtime = game.rooms[4];
  runtime.hazards.push({ x: 115, y: 490, radius: 78, timer: 0.6, duration: 1.25, active: 0.3 });
  game.effects.push({ kind: 'slash', x: 92, y: 300, angle: 0, range: 108, halfAngle: 0.95, remaining: 0.1, duration: 0.16 });
  const arcs = [];
  const ctx = new Proxy({ arc(...args) { arcs.push(args); } }, { get(object, property) { return property in object ? object[property] : () => {}; }, set(object, property, value) { object[property] = value; return true; } });
  const before = structuredClone(game); renderGame(ctx, game, { x: 200, y: 300 });
  assert.ok(arcs.some(([x, y, radius]) => x === 115 && y === 490 && radius === 78));
  assert.deepEqual(game, before);
  for (const kind of ['melee', 'ranged', 'elite', 'boss']) {
    runtime.enemies[0].kind = kind; renderGame(ctx, game);
  }
});

test('audio waits for a gesture unlock, maps attack/damage to distinct tones, and honors mute', async () => {
  const tones = [];
  class Context {
    state = 'suspended'; currentTime = 10; destination = {};
    async resume() { this.state = 'running'; }
    createOscillator() { const tone = { frequency: [], type: null }; tones.push(tone); return {
      set type(value) { tone.type = value; }, frequency: { setValueAtTime(value) { tone.frequency.push(value); }, exponentialRampToValueAtTime(value) { tone.frequency.push(value); } },
      connect() {}, disconnect() {}, start() {}, stop() {},
    }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  const audio = createAudio(Context); audio.consume([{ type: 'player-attack' }]); assert.equal(tones.length, 0);
  assert.equal(await audio.unlock(), true); audio.consume([{ type: 'player-attack' }, { type: 'player-damaged' }, { type: 'room-entered' }]);
  assert.equal(tones.length, 2); assert.notDeepEqual(tones[0], tones[1]);
  audio.setMuted(true); audio.consume([{ type: 'player-attack' }]); assert.equal(tones.length, 2);
});
