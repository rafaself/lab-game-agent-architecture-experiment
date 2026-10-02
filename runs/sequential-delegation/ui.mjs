import { currentRoom, isRoomLocked } from './model.mjs';
import { UPGRADES } from './upgrades.mjs';

const ICONS = { damage: '⚔', cadence: '↻', movement: '➶', survival: '♡' };
export const screenKey = game => game.phase === 'playing' ? game.pendingReward ? 'reward' : 'playing' : game.phase;

export function hudData(game) {
  const { definition, runtime } = currentRoom(game);
  const hostiles = runtime.enemies.filter(enemy => enemy.health > 0).length;
  return {
    seed: game.seed, health: game.player.health, maxHealth: game.player.maxHealth,
    roomNumber: game.roomIndex + 1, roomTotal: game.dungeon.rooms.length,
    name: definition.name, hostiles,
    status: definition.kind === 'start' ? 'SANCTUARY · EXIT OPEN' : isRoomLocked(game)
      ? `${hostiles} HOSTILE${hostiles === 1 ? '' : 'S'} · LOCKED` : 'CLEARED · EXITS OPEN',
    protection: game.player.health === 0 ? 'Defeated' : game.player.damageFlash > 0 ? 'Hit! Briefly protected'
      : game.player.invulnerable > 0 ? 'Protected · dashed shield' : 'Read gold warnings. Move to evade.',
    damage: game.player.damage, cadence: game.player.attackCooldown.toFixed(2), speed: Math.round(game.player.speed),
    upgrades: game.player.upgrades.map(id => UPGRADES[id]),
  };
}

export function createUI(document, callbacks) {
  const element = id => document.getElementById(id);
  const text = (id, value) => { if (element(id).textContent !== String(value)) element(id).textContent = value; };
  const panels = { menu: element('menu-screen'), reward: element('reward-screen'), 'game-over': element('end-screen'), victory: element('end-screen') };
  let previousScreen = null;
  let rewardSignature = '';
  let upgradeSignature = '';
  let routeSignature = '';
  let noticeUntil = 0;
  function buildRewards(game) {
    const signature = `${game.pendingReward.roomIndex}:${game.pendingReward.offers.join(',')}`;
    if (signature === rewardSignature) return;
    rewardSignature = signature;
    element('reward-choices').replaceChildren();
    for (const id of game.pendingReward.offers) {
      const upgrade = UPGRADES[id];
      const button = document.createElement('button'); button.type = 'button'; button.className = 'reward-card'; button.dataset.upgrade = id;
      for (const [tag, className, content] of [['span', 'reward-icon', ICONS[id]], ['small', '', upgrade.category], ['strong', '', upgrade.name], ['p', '', upgrade.description], ['span', 'reward-select', 'Take this gift →']]) {
        const child = document.createElement(tag); child.className = className; child.textContent = content; button.append(child);
      }
      button.addEventListener('click', () => callbacks.chooseReward(id));
      element('reward-choices').append(button);
    }
  }
  function buildUpgrades(game, data) {
    const signature = game.player.upgrades.join(',');
    if (signature === upgradeSignature && element('upgrade-list').childElementCount) return;
    upgradeSignature = signature; element('upgrade-list').replaceChildren();
    if (!data.upgrades.length) {
      const empty = document.createElement('span'); empty.className = 'subtle'; empty.textContent = 'No run upgrades yet'; element('upgrade-list').append(empty); return;
    }
    const counts = new Map();
    data.upgrades.forEach(upgrade => counts.set(upgrade.id, (counts.get(upgrade.id) || 0) + 1));
    for (const [id, count] of counts) {
      const chip = document.createElement('span'); chip.className = 'upgrade-chip';
      chip.textContent = `${ICONS[id]} ${UPGRADES[id].name}${count > 1 ? ` ×${count}` : ''}`;
      chip.title = UPGRADES[id].description; element('upgrade-list').append(chip);
    }
  }
  function buildRoute(game) {
    const signature = `${game.roomIndex}:${game.rooms.map(room => Number(room.cleared)).join('')}`;
    if (signature === routeSignature) return;
    routeSignature = signature; element('route').replaceChildren();
    game.dungeon.rooms.forEach((room, index) => {
      const node = document.createElement('span'); node.className = `route-node${game.rooms[index].cleared ? ' cleared' : ''}${index === game.roomIndex ? ' current' : ''}`;
      node.title = `${index + 1}. ${room.name}${game.rooms[index].cleared ? ' · cleared' : ''}`;
      node.setAttribute('aria-label', node.title); element('route').append(node);
    });
  }
  function consumeNotices(events, game, now) {
    if (screenKey(game) !== 'playing') { element('notice').classList.remove('visible'); return; }
    for (const event of events) {
      let message = '';
      if (event.type === 'door-blocked') message = 'Door locked · defeat every hostile to open it';
      if (event.type === 'room-entered') message = `Room ${game.roomIndex + 1} · ${currentRoom(game).definition.name}`;
      if (event.type === 'upgrade-selected') message = `${UPGRADES[event.id].name} acquired · effect applied`;
      if (event.type === 'run-started') message = 'Follow the east door → Aim with the mouse';
      if (message) { text('notice', message); noticeUntil = now + 2200; }
    }
    element('notice').classList.toggle('visible', now < noticeUntil);
  }
  return {
    update(game, events = [], now = 0) {
      const data = hudData(game); const screen = screenKey(game);
      text('seed-label', `SEED ${data.seed}`); text('health-text', `${Math.ceil(data.health)} / ${data.maxHealth}`);
      element('health-fill').style.width = `${100 * data.health / data.maxHealth}%`;
      element('health-fill').classList.toggle('low', data.health / data.maxHealth < 0.3);
      text('protection-label', data.protection); text('room-progress', `ROOM ${data.roomNumber} / ${data.roomTotal}`);
      text('room-status', data.status); text('room-name', data.name);
      text('damage-stat', data.damage); text('cadence-stat', `${data.cadence}s`); text('speed-stat', data.speed);
      buildUpgrades(game, data); buildRoute(game);
      if (screen === 'reward') buildRewards(game);
      if (screen !== previousScreen) {
        new Set(Object.values(panels)).forEach(panel => { panel.hidden = true; });
        if (panels[screen]) panels[screen].hidden = false;
        if (screen === 'menu') { element('seed-input').value = String(game.seed); element('start-button').focus({ preventScroll: true }); }
        if (screen === 'reward') element('reward-choices').firstElementChild?.focus({ preventScroll: true });
        if (screen === 'game-over' || screen === 'victory') {
          const won = screen === 'victory';
          text('end-symbol', won ? '◇' : '✕'); text('end-eyebrow', won ? 'THE WARDEN HAS FALLEN' : 'THE DUNGEON REMAINS');
          text('end-title', won ? 'Victory' : 'Game Over');
          text('end-description', won ? 'The last gate opens. You escaped the dungeon.' : 'Your blade falls silent. Read the next warning and try again.');
          text('end-summary', `SEED ${game.seed} · ${data.roomNumber} / ${data.roomTotal} ROOMS · ${game.player.upgrades.length} GIFTS · ${Math.floor(game.time)}s`);
          element('restart-button').focus({ preventScroll: true });
        }
        if (screen === 'playing') element('arena').focus({ preventScroll: true });
        previousScreen = screen;
      }
      consumeNotices(events, game, now);
    },
  };
}
