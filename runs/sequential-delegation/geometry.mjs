export const WORLD = Object.freeze({ width: 960, height: 600, wall: 28, doorTop: 236, doorBottom: 364 });

export function circleHitsRect(x, y, radius, rectangle) {
  const nearestX = Math.max(rectangle.x, Math.min(x, rectangle.x + rectangle.width));
  const nearestY = Math.max(rectangle.y, Math.min(y, rectangle.y + rectangle.height));
  return (x - nearestX) ** 2 + (y - nearestY) ** 2 < radius ** 2;
}

export function blockedAt(x, y, radius, obstacles) {
  return obstacles.some(rectangle => circleHitsRect(x, y, radius, rectangle));
}

export function segmentHitsRect(x1, y1, x2, y2, rectangle, padding = 0) {
  const minX = rectangle.x - padding;
  const maxX = rectangle.x + rectangle.width + padding;
  const minY = rectangle.y - padding;
  const maxY = rectangle.y + rectangle.height + padding;
  let enter = 0;
  let leave = 1;
  for (const [start, delta, min, max] of [[x1, x2 - x1, minX, maxX], [y1, y2 - y1, minY, maxY]]) {
    if (Math.abs(delta) < 1e-10) {
      if (start < min || start > max) return false;
    } else {
      const first = (min - start) / delta;
      const second = (max - start) / delta;
      enter = Math.max(enter, Math.min(first, second));
      leave = Math.min(leave, Math.max(first, second));
      if (enter > leave) return false;
    }
  }
  return true;
}

export function lineBlocked(x1, y1, x2, y2, obstacles, padding = 0) {
  return obstacles.some(rectangle => segmentHitsRect(x1, y1, x2, y2, rectangle, padding));
}

export function moveCircle(actor, dx, dy, obstacles) {
  const min = WORLD.wall + actor.radius;
  const maxX = WORLD.width - WORLD.wall - actor.radius;
  const maxY = WORLD.height - WORLD.wall - actor.radius;
  const x = Math.max(min, Math.min(maxX, actor.x + dx));
  if (!blockedAt(x, actor.y, actor.radius, obstacles)) actor.x = x;
  const y = Math.max(min, Math.min(maxY, actor.y + dy));
  if (!blockedAt(actor.x, y, actor.radius, obstacles)) actor.y = y;
}

// A tiny visibility graph routes pursuers around the small authored obstacle pool.
// It is rebuilt only when an enemy refreshes its path, never on render frames.
export function findPath(x, y, targetX, targetY, radius, obstacles) {
  const padding = radius + 3;
  if (!lineBlocked(x, y, targetX, targetY, obstacles, padding)) return [{ x: targetX, y: targetY }];
  const points = [{ x, y }, { x: targetX, y: targetY }];
  for (const rectangle of obstacles) {
    for (const px of [rectangle.x - padding - 1, rectangle.x + rectangle.width + padding + 1]) {
      for (const py of [rectangle.y - padding - 1, rectangle.y + rectangle.height + padding + 1]) {
        if (px > WORLD.wall + radius && px < WORLD.width - WORLD.wall - radius &&
            py > WORLD.wall + radius && py < WORLD.height - WORLD.wall - radius &&
            !blockedAt(px, py, padding, obstacles)) points.push({ x: px, y: py });
      }
    }
  }
  const distances = points.map(() => Infinity);
  const previous = points.map(() => -1);
  const visited = new Set();
  distances[0] = 0;
  for (let step = 0; step < points.length; step++) {
    let index = -1;
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i) && (index < 0 || distances[i] < distances[index])) index = i;
    }
    if (index < 0 || !Number.isFinite(distances[index])) break;
    if (index === 1) break;
    visited.add(index);
    for (let next = 0; next < points.length; next++) {
      if (visited.has(next) || next === index) continue;
      const a = points[index];
      const b = points[next];
      if (lineBlocked(a.x, a.y, b.x, b.y, obstacles, padding)) continue;
      const candidate = distances[index] + Math.hypot(a.x - b.x, a.y - b.y);
      if (candidate < distances[next]) {
        distances[next] = candidate;
        previous[next] = index;
      }
    }
  }
  if (!Number.isFinite(distances[1])) return [];
  const path = [];
  for (let i = 1; i !== 0; i = previous[i]) path.unshift(points[i]);
  return path;
}
