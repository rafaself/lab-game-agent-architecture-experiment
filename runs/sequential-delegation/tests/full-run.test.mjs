import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startRun, updateGame, chooseReward, currentRoom } from '../model.mjs';
import { findPath } from '../geometry.mjs';

// This controller uses only normal movement, aiming, attacks, and reward selection.
// It never changes health, room indices, enemy state, cooldowns, or player statistics.
for (const seed of [17, 42]) {
  test(`seed ${seed} supports a complete run through doors, combat, rewards, and boss`, () => {
    const game = startRun(createGame({ seed }));
    for (let step = 0; step < 120 * 120 && game.phase === 'playing'; step++) {
      if (game.pendingReward) {
        const preference = ['survival', 'damage', 'cadence', 'movement'];
        chooseReward(game, preference.find(id => game.pendingReward.offers.includes(id)));
        continue;
      }
      const { runtime, definition } = currentRoom(game);
      const alive = runtime.enemies.filter(enemy => enemy.health > 0).sort((a, b) =>
        Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y));
      const aim = alive[0] ?? { x: 945, y: 300 };
      let targetX = aim.x;
      let targetY = aim.y;
      if (alive.length && Math.hypot(targetX - game.player.x, targetY - game.player.y) < 85) {
        targetX = game.player.x;
        targetY = game.player.y;
      }
      const next = findPath(game.player.x, game.player.y, targetX, targetY, game.player.radius, definition.obstacles)[0]
        ?? { x: targetX, y: targetY };
      const dx = next.x - game.player.x;
      const dy = next.y - game.player.y;
      const length = Math.hypot(dx, dy);
      updateGame(game, 1 / 120, { moveX: length > 3 ? dx / length : 0, moveY: length > 3 ? dy / length : 0,
        aimX: aim.x, aimY: aim.y, attack: alive.length > 0 });
    }
    assert.equal(game.phase, 'victory');
    assert.equal(game.roomIndex, 4);
    assert.ok(game.player.health > 0);
    assert.equal(game.player.upgrades.length, 3);
    assert.ok(game.rooms.every(room => room.visited && room.cleared && room.rewardClaimed));
    assert.equal(game.events.filter(event => event.type === 'upgrade-selected').length, 3);
    assert.equal(game.events.filter(event => event.type === 'victory').length, 1);
  });
}
