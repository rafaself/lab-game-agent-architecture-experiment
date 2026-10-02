export const UPGRADE_DEFINITIONS = Object.freeze({
  damage: Object.freeze({
    id: 'damage',
    name: 'Tempered Edge',
    short: 'Damage',
    description: 'Deal 1 more damage with every strike.',
  }),
  haste: Object.freeze({
    id: 'haste',
    name: 'Echo Thread',
    short: 'Attack speed',
    description: 'Reduce your attack recovery by 18%.',
  }),
  swift: Object.freeze({
    id: 'swift',
    name: 'Windstep',
    short: 'Movement',
    description: 'Move 28 pixels per second faster.',
  }),
  vitality: Object.freeze({
    id: 'vitality',
    name: 'Heartwood',
    short: 'Vitality',
    description: 'Gain 2 maximum health and restore 2 health.',
  }),
});

export const UPGRADE_IDS = Object.freeze(Object.keys(UPGRADE_DEFINITIONS));

export function createFreshPlayer() {
  return {
    x: 122,
    y: 320,
    radius: 15,
    health: 8,
    maxHealth: 8,
    speed: 220,
    damage: 1,
    attackCooldown: 0.34,
    cooldown: 0,
    attackTimer: 0,
    attackAngle: 0,
    invulnerability: 0,
    knockbackX: 0,
    knockbackY: 0,
    upgrades: {},
  };
}

export function applyUpgrade(player, upgradeId) {
  const definition = UPGRADE_DEFINITIONS[upgradeId];
  if (!definition) throw new RangeError(`Unknown upgrade: ${upgradeId}`);

  const next = { ...player, upgrades: { ...player.upgrades } };
  next.upgrades[upgradeId] = (next.upgrades[upgradeId] ?? 0) + 1;

  switch (upgradeId) {
    case 'damage':
      next.damage += 1;
      break;
    case 'haste':
      next.attackCooldown = Math.max(0.16, next.attackCooldown * 0.82);
      break;
    case 'swift':
      next.speed += 28;
      break;
    case 'vitality':
      next.maxHealth += 2;
      next.health = Math.min(next.maxHealth, next.health + 2);
      break;
  }

  return next;
}

export function damagePlayer(player, amount, invulnerabilitySeconds = 0.85) {
  if (player.health <= 0 || player.invulnerability > 0) {
    return { player, tookDamage: false };
  }

  const next = {
    ...player,
    health: Math.max(0, player.health - Math.max(0, amount)),
    invulnerability: invulnerabilitySeconds,
  };
  return { player: next, tookDamage: true };
}
