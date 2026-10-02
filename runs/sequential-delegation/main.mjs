import { createGame, startRun, returnToMenu, chooseReward, WORLD } from './model.mjs';
import { parseSeed } from './rng.mjs';
import { createInput } from './input.mjs';
import { createAudio } from './audio.mjs';
import { renderGame } from './renderer.mjs';
import { createUI } from './ui.mjs';
import { createFrameDriver } from './presentation.mjs';

const seed = parseSeed(new URLSearchParams(window.location.search).get('seed'));
const game = createGame({ seed });
const canvas = document.getElementById('arena');
const context = canvas.getContext('2d');
const input = createInput(canvas, WORLD);
const audio = createAudio();
const seedInput = document.getElementById('seed-input');
const seedError = document.getElementById('seed-error');
const soundButton = document.getElementById('sound-toggle');
let muted = false;
let previousFrame = null;
let deviceScale = 0;
seedInput.value = String(seed);

function resizeCanvas() {
  const scale = Math.min(2, window.devicePixelRatio || 1);
  if (deviceScale === scale) return;
  deviceScale = scale;
  canvas.width = Math.round(WORLD.width * scale);
  canvas.height = Math.round(WORLD.height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
}

const ui = createUI(document, {
  chooseReward(id) { input.clear(); chooseReward(game, id); void audio.unlock(); },
});
const frame = createFrameDriver(game, { input, audio, ui, render: (state, pointer) => renderGame(context, state, pointer) });

document.getElementById('start-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!/^\d+$/.test(seedInput.value) || Number(seedInput.value) > 0xffffffff) {
    seedError.textContent = 'Enter a whole number from 0 to 4294967295.'; seedInput.focus(); return;
  }
  seedError.textContent = '';
  await audio.unlock(); input.clear(); startRun(game, parseSeed(seedInput.value));
  const url = new URL(window.location.href); url.searchParams.set('seed', String(game.seed));
  window.history.replaceState(null, '', url);
  previousFrame = null;
});
seedInput.addEventListener('input', () => { seedError.textContent = ''; });
document.getElementById('restart-button').addEventListener('click', async () => {
  await audio.unlock(); input.clear(); startRun(game, game.seed); previousFrame = null;
});
document.getElementById('menu-button').addEventListener('click', () => {
  input.clear(); returnToMenu(game); seedError.textContent = '';
});
soundButton.addEventListener('click', async () => {
  muted = !muted; audio.setMuted(muted);
  if (!muted) await audio.unlock();
  soundButton.textContent = audio.status().unavailable ? 'Sound unavailable' : muted ? 'Sound off' : 'Sound on';
  soundButton.setAttribute('aria-pressed', String(!muted));
  if (game.phase === 'playing' && !game.pendingReward) canvas.focus({ preventScroll: true });
});
window.addEventListener('pointerdown', () => { void audio.unlock(); });
window.addEventListener('keydown', () => { void audio.unlock(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { input.clear(); previousFrame = null; } });

// An isolated copy for inspection. It cannot issue commands or alter live state.
window.dungeonSnapshot = () => structuredClone({
  phase: game.phase, seed: game.seed, time: game.time, roomIndex: game.roomIndex,
  player: game.player, pendingReward: game.pendingReward, dungeon: game.dungeon,
  rooms: game.rooms, effects: game.effects,
});

function animate(now) {
  resizeCanvas();
  const elapsed = previousFrame === null ? 0 : (now - previousFrame) / 1000;
  previousFrame = now;
  frame(elapsed, now);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
