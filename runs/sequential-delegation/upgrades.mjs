export const UPGRADES = Object.freeze({
  damage: Object.freeze({ id: 'damage', name: 'Tempered Edge', category: 'damage',
    description: '+8 slash damage. Finish dangerous foes with fewer strikes.' }),
  cadence: Object.freeze({ id: 'cadence', name: 'Quick Hands', category: 'cadence',
    description: '25% shorter attack cooldown. More strikes while you reposition.' }),
  movement: Object.freeze({ id: 'movement', name: 'Windstep', category: 'movement',
    description: '+18% movement speed. Escape warning zones more quickly.' }),
  survival: Object.freeze({ id: 'survival', name: 'Heart Vessel', category: 'survival',
    description: '+25 maximum health and heal 25. More room for mistakes.' }),
});

export const BASE_STATS = Object.freeze({
  maxHealth: 100, speed: 205, damage: 20, attackCooldown: 0.42,
  attackRange: 108, attackHalfAngle: 0.95, invulnerability: 0.85,
});

export function applyUpgrade(player, id) {
  if (!UPGRADES[id]) return false;
  if (id === 'damage') player.damage += 8;
  if (id === 'cadence') player.attackCooldown = Math.max(0.16, player.attackCooldown * 0.75);
  if (id === 'movement') player.speed *= 1.18;
  if (id === 'survival') {
    player.maxHealth += 25;
    player.health = Math.min(player.maxHealth, player.health + 25);
  }
  player.upgrades.push(id);
  return true;
}
