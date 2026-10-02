import { createRun, currentRoom, livingEnemies, exitLocked, selectUpgrade } from './state.js';
import { parseSeed } from './dungeon.js';
import { update } from './combat.js';
import { render } from './renderer.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { UPGRADES } from './constants.js';

const byId = id => document.getElementById(id);
const canvas = byId('arena');
const ctx = canvas.getContext('2d');
const audio = createAudio();
const input = createInput(canvas, togglePause);
let run = null;
let preview = createRun(17);
let screen = '';
let previousTime = performance.now();
let hudTimer = 0;
const initialSeed = parseSeed(new URLSearchParams(location.search).get('seed'));
byId('seed').value = initialSeed ?? 17;

function setText(id, text) { if (byId(id).textContent !== text) byId(id).textContent = text; }
function togglePause() {
  if (!run || run.state !== 'playing' || run.rewardPending) return;
  run.paused = !run.paused; input.clear(); syncScreen();
  if (!run.paused) canvas.focus({ preventScroll: true });
}
async function unlockAudio() {
  try { await audio.unlock(); }
  catch { byId('sound').textContent = 'Sound unavailable'; }
}
function start(seed) {
  run = createRun(seed); preview = run; screen = ''; input.clear(); hudTimer = 1;
  history.replaceState(null, '', `?seed=${seed}`);
  byId('seed').value = seed;
  syncScreen(); syncHud(); canvas.focus({ preventScroll: true });
}
function menu() {
  run = null; screen = ''; input.clear(); syncScreen();
  byId('seed').focus();
}
byId('start-form').addEventListener('submit', event => {
  event.preventDefault();
  const seed = parseSeed(byId('seed').value);
  if (seed === null) { setText('seed-error', 'Enter a whole number from 0 to 4294967295.'); return; }
  setText('seed-error', ''); unlockAudio(); start(seed);
});
byId('random-seed').addEventListener('click', () => {
  byId('seed').value = crypto.getRandomValues(new Uint32Array(1))[0]; setText('seed-error', '');
});
byId('seed').addEventListener('input', () => setText('seed-error', ''));
byId('sound').addEventListener('click', () => {
  const enabled = audio.toggle(); unlockAudio();
  byId('sound').textContent = enabled ? 'Sound on' : 'Sound off';
  byId('sound').setAttribute('aria-pressed', String(enabled));
});
byId('pause').addEventListener('click', togglePause);
byId('resume').addEventListener('click', togglePause);
byId('menu-action').addEventListener('click', menu);
byId('end-menu').addEventListener('click', menu);
byId('restart').addEventListener('click', () => { unlockAudio(); start(run.seed); });
byId('choices').addEventListener('click', event => {
  const button = event.target.closest('button[data-upgrade]');
  if (button && run && selectUpgrade(run, button.dataset.upgrade)) {
    input.clear(); syncScreen(); syncHud(); canvas.focus({ preventScroll: true });
  }
});
window.addEventListener('blur', () => {
  if (run?.state === 'playing' && !run.rewardPending) { run.paused = true; syncScreen(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && run?.state === 'playing' && !run.rewardPending) { run.paused = true; syncScreen(); }
});

function syncScreen() {
  const next = !run ? 'menu' : run.state !== 'playing' ? 'end' : run.rewardPending ? 'reward' : run.paused ? 'paused' : 'playing';
  if (next === screen) return;
  screen = next;
  for (const name of ['menu', 'reward', 'end', 'paused']) byId(name).hidden = name !== screen;
  byId('hud').hidden = !run;
  byId('pause').hidden = !run || run.state !== 'playing' || run.rewardPending;
  byId('menu-action').hidden = !run;
  document.body.classList.toggle('playing', Boolean(run));
  setText('pause', run?.paused ? 'Resume' : 'Pause');
  if (screen === 'menu') byId('upgrades').innerHTML = '<span class="fine">No permanent progress. Every descent starts fresh.</span>';
  if (screen === 'reward') {
    byId('choices').replaceChildren(...currentRoom(run).offers.map(id => {
      const upgrade = UPGRADES[id];
      const button = document.createElement('button');
      button.className = 'choice'; button.dataset.upgrade = id;
      button.innerHTML = `<div class="choice-icon" aria-hidden="true">${upgrade.icon}</div><span class="eyebrow">${upgrade.category}</span><strong>${upgrade.name}</strong><span class="effect">${upgrade.description}</span><span class="detail">${upgrade.detail}</span>`;
      return button;
    }));
    input.clear();
  }
  if (screen === 'end') {
    const victory = run.state === 'victory';
    setText('end-symbol', victory ? '✧' : '◇');
    setText('end-eyebrow', victory ? 'THE VAULT IS OPEN' : 'THE EMBER FADES');
    setText('end-title', victory ? 'You escaped.' : 'Game Over');
    setText('end-description', victory ? 'The Warden has fallen. Carry your light into the dawn.' : 'The dungeon keeps its secrets. A fresh descent awaits.');
    setText('end-summary', `Seed ${run.seed} · ${run.kills} enemies defeated · ${run.player.upgrades.length} upgrades · ${Math.floor(run.time / 60)}m ${Math.floor(run.time % 60)}s`);
    input.clear();
  }
}

function syncHud() {
  if (!run) return;
  const p = run.player;
  const room = currentRoom(run);
  setText('health-text', `${Math.ceil(p.hp)} / ${p.maxHp}`);
  byId('health-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  setText('stats', `${p.damage} damage · ${p.cadence.toFixed(2)}s cooldown · ${Math.round(p.speed)} speed`);
  setText('room-text', `${run.roomIndex + 1} / 5 · ${room.name}`);
  const active = livingEnemies(run).length;
  setText('status', active ? `Active · ${active} hostile${active === 1 ? '' : 's'}` : run.rewardPending ? 'Cleared · choose reward' : 'Cleared · exit open');
  byId('status').classList.toggle('active', Boolean(active));
  setText('seed-text', `Seed ${run.seed}`);
  const routeMarkup = run.rooms.map((r, index) => `<span class="${index === run.roomIndex ? 'current' : r.cleared ? 'cleared' : ''}" title="${r.name}">${r.type === 'boss' ? '◆' : index + 1}</span>`).join('');
  if (byId('route').innerHTML !== routeMarkup) byId('route').innerHTML = routeMarkup;
  const upgradeMarkup = p.upgrades.length ? p.upgrades.map(id => `<span class="upgrade-chip">${UPGRADES[id].icon} ${UPGRADES[id].name}</span>`).join('') : '<span class="fine">No upgrades yet · clear a chamber to forge one.</span>';
  if (byId('upgrades').innerHTML !== upgradeMarkup) byId('upgrades').innerHTML = upgradeMarkup;
  byId('notice').hidden = run.noticeTimer <= 0 || run.rewardPending || screen !== 'playing';
  setText('notice', run.notice);
  // Read-only observation data supports local browser testing; it cannot alter play.
  canvas.dataset.playerX = p.x.toFixed(2); canvas.dataset.playerY = p.y.toFixed(2);
  canvas.dataset.health = String(p.hp); canvas.dataset.room = String(run.roomIndex);
  canvas.dataset.exitLocked = String(exitLocked(run));
  canvas.dataset.enemies = JSON.stringify(livingEnemies(run).map(e => ({ kind: e.kind, x: +e.x.toFixed(1), y: +e.y.toFixed(1), hp: e.hp, phase: e.phase, pattern: e.pattern, timer: +e.timer.toFixed(2) })));
  canvas.dataset.hazards = JSON.stringify(run.hazards.map(h => ({ x: h.x, y: h.y, warning: h.warning })));
  canvas.dataset.shots = String(run.projectiles.length);
  canvas.dataset.invulnerable = p.invulnerable.toFixed(2);
  canvas.dataset.state = run.state; canvas.dataset.paused = String(run.paused);
  canvas.dataset.audio = JSON.stringify(audio.status());
}

function frame(now) {
  const dt = Math.min(.05, (now - previousTime) / 1000);
  previousTime = now;
  if (run) {
    update(run, input.read(), dt);
    for (const event of run.events.splice(0)) audio.play(event.type);
    syncScreen(); hudTimer += dt;
    if (hudTimer >= .1) { syncHud(); hudTimer = 0; }
  }
  render(ctx, run || preview);
  requestAnimationFrame(frame);
}
syncScreen(); requestAnimationFrame(frame);
