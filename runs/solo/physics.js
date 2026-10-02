import { WIDTH, HEIGHT, WALL } from './constants.js';

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function direction(x, y) {
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
export function hitsBlock(x, y, radius, block) {
  return Math.hypot(x - clamp(x, block[0], block[0] + block[2]), y - clamp(y, block[1], block[1] + block[3])) < radius;
}
export function moveBody(body, dx, dy, blocks) {
  const oldX = body.x;
  body.x = clamp(body.x + dx, WALL + body.radius, WIDTH - WALL - body.radius);
  if (blocks.some(b => hitsBlock(body.x, body.y, body.radius, b))) body.x = oldX;
  const oldY = body.y;
  body.y = clamp(body.y + dy, WALL + body.radius, HEIGHT - WALL - body.radius);
  if (blocks.some(b => hitsBlock(body.x, body.y, body.radius, b))) body.y = oldY;
}
