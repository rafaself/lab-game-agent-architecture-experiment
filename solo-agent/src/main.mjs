import { AudioCues } from './audio.mjs';
import { createRandomSeed, normalizeSeed } from './dungeon.mjs';
import { DungeonGame } from './game.mjs';
import { UPGRADE_DEFINITIONS } from './rules.mjs';
import { GameRenderer } from './renderer.mjs';

const canvas = document.querySelector('#game-canvas');
const renderer = new GameRenderer(canvas);
const audio = new AudioCues();
const ui = {
  hud: document.querySelector('#hud'),
  menu: document.querySelector('#menu-panel'),
  reward: document.querySelector('#reward-panel'),
  end: document.querySelector('#end-panel'),
  seedInput: document.querySelector('#seed-input'),
  seedError: document.querySelector('#seed-error'),
  health: document.querySelector('#health-readout'),
  room: document.querySelector('#room-readout'),
  roomStatus: document.querySelector('#room-status'),
  upgrades: document.querySelector('#upgrade-readout'),
  seed: document.querySelector('#seed-readout'),
  endEyebrow: document.querySelector('#end-eyebrow'),
  endTitle: document.querySelector('#end-title'),
  endCopy: document.querySelector('#end-copy'),
  endStats: document.querySelector('#end-stats'),
  sound: document.querySelector('#sound-button'),
};

let game;

function renderHealth() {
  ui.health.replaceChildren();
  for (let index = 0; index < game.player.maxHealth; index += 1) {
    const heart = document.createElement('span');
    const filled = index < game.player.health;
    heart.className = filled ? 'filled-heart' : 'empty-heart';
    heart.textContent = filled ? '♥' : '♡';
    heart.setAttribute('aria-hidden', 'true');
    ui.health.append(heart);
  }
  ui.health.setAttribute('aria-label', `${game.player.health} of ${game.player.maxHealth} health`);
}

function renderHud() {
  if (!game || !game.dungeon) return;
  renderHealth();
  ui.room.textContent = `Room ${game.roomIndex + 1} of ${game.dungeon.rooms.length} · ${game.currentRoom.name}`;
  const state = game.currentState;
  ui.roomStatus.textContent = state.cleared ? 'CLEARED · EXITS OPEN' : game.currentRoom.type === 'boss' ? 'BOSS ACTIVE' : 'ACTIVE · EXITS LOCKED';
  ui.roomStatus.classList.toggle('cleared', state.cleared);
  const upgrades = Object.entries(game.player.upgrades);
  ui.upgrades.textContent = upgrades.length === 0
    ? 'None yet'
    : upgrades.map(([id, count]) => `${UPGRADE_DEFINITIONS[id].name} ×${count}`).join('  ·  ');
  ui.seed.textContent = String(game.seed);
}

function showRewardOptions() {
  const options = game.currentRoom.offers;
  options.forEach((id, index) => {
    const definition = UPGRADE_DEFINITIONS[id];
    const button = document.querySelector(`#reward-option-${index}`);
    button.querySelector('strong').textContent = definition.name;
    button.querySelector('.reward-copy span').textContent = definition.description;
    button.setAttribute('aria-label', `${definition.name}. ${definition.description}`);
  });
}

function updatePanels() {
  const mode = game.mode;
  ui.menu.hidden = mode !== 'menu';
  ui.reward.hidden = mode !== 'reward';
  ui.end.hidden = mode !== 'gameover' && mode !== 'victory';
  ui.hud.hidden = mode === 'menu' || mode === 'gameover' || mode === 'victory';
  if (mode !== 'menu') renderHud();
  if (mode === 'reward') {
    showRewardOptions();
    requestAnimationFrame(() => document.querySelector('#reward-option-0').focus());
  }
  if (mode === 'victory' || mode === 'gameover') {
    const won = mode === 'victory';
    ui.endEyebrow.textContent = won ? 'The seal is broken' : 'The dungeon keeps its silence';
    ui.endTitle.textContent = won ? 'You escaped.' : 'The run is over.';
    ui.endCopy.textContent = won
      ? 'The Hollow Crown falls, and the way home opens at last.'
      : 'Your light has gone out. The chambers will be here when you return.';
    const relicCount = Object.values(game.player.upgrades).reduce((sum, count) => sum + count, 0);
    ui.endStats.textContent = `${relicCount} relic ${relicCount === 1 ? 'chosen' : 'choices'} · seed ${game.seed}`;
    requestAnimationFrame(() => document.querySelector('#again-button').focus());
  }
}

game = new DungeonGame({
  onChange: updatePanels,
  onSound: (name) => audio.play(name),
});

const querySeed = new URLSearchParams(window.location.search).get('seed');
if (querySeed !== null) {
  const normalized = normalizeSeed(querySeed);
  if (normalized === null) {
    ui.seedError.textContent = 'Seed must be a whole number from 0 to 4294967295.';
  } else {
    ui.seedInput.value = String(normalized);
  }
}

async function beginRun() {
  const rawSeed = ui.seedInput.value.trim();
  let seed;
  if (rawSeed.length === 0) seed = createRandomSeed();
  else {
    seed = normalizeSeed(rawSeed);
    if (seed === null) {
      ui.seedError.textContent = 'Seed must be a whole number from 0 to 4294967295.';
      ui.seedInput.focus();
      return;
    }
  }
  ui.seedError.textContent = '';
  try { await audio.unlock(); } catch { /* Browsers may decline audio; visual cues remain available. */ }
  game.startRun(seed);
  canvas.focus({ preventScroll: true });
}

document.querySelector('#start-button').addEventListener('click', beginRun);
ui.seedInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') beginRun();
});

document.querySelectorAll('.reward-option').forEach((button, index) => {
  button.addEventListener('click', () => {
    const upgradeId = game.currentRoom?.offers[index];
    if (upgradeId) game.chooseUpgrade(upgradeId);
  });
});

document.querySelector('#again-button').addEventListener('click', async () => {
  try { await audio.unlock(); } catch { /* Keep gameplay available if audio is unavailable. */ }
  game.startRun(game.seed ?? createRandomSeed());
  canvas.focus({ preventScroll: true });
});

document.querySelector('#menu-button').addEventListener('click', () => {
  ui.seedInput.value = '';
  ui.seedError.textContent = '';
  game.showMenu();
  document.querySelector('#start-button').focus();
});

ui.sound.addEventListener('click', async () => {
  const enabled = ui.sound.getAttribute('aria-pressed') !== 'true';
  audio.setEnabled(enabled);
  ui.sound.setAttribute('aria-pressed', String(enabled));
  ui.sound.textContent = enabled ? 'Sound on' : 'Sound off';
  if (enabled) {
    try { await audio.unlock(); } catch { /* Sound is optional. */ }
    audio.play('reward');
  }
});

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (960 / rect.width),
    y: (event.clientY - rect.top) * (640 / rect.height),
  };
}

canvas.addEventListener('pointermove', (event) => {
  const point = pointerPosition(event);
  game.setAim(point.x, point.y);
});

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || game.mode !== 'playing') return;
  event.preventDefault();
  const point = pointerPosition(event);
  game.setAim(point.x, point.y);
  game.tryAttack();
});

canvas.addEventListener('contextmenu', (event) => event.preventDefault());

const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement) return;
  const key = event.key.toLowerCase();
  if (movementKeys.has(key)) {
    event.preventDefault();
    game.setKey(key, true);
  } else if (event.code === 'Space' && game.mode === 'playing') {
    event.preventDefault();
    if (!event.repeat) game.tryAttack();
  }
});

window.addEventListener('keyup', (event) => {
  game.setKey(event.key, false);
});

window.addEventListener('blur', () => {
  for (const key of movementKeys) game.setKey(key, false);
});

let previousFrame = 0;
function frame(now) {
  if (previousFrame !== 0) game.tick((now - previousFrame) / 1000);
  previousFrame = now;
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
