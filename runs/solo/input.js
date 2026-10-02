import { WIDTH, HEIGHT } from './constants.js';

export function createInput(canvas, onPause) {
  const keys = new Set();
  const tapped = new Set();
  let mouseDown = false;
  let attackQueued = false;
  let aim = { x: WIDTH * .75, y: HEIGHT / 2 };
  const clear = () => { keys.clear(); tapped.clear(); mouseDown = false; attackQueued = false; };
  window.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    tapped.add(event.code);
    if (event.code === 'Space') attackQueued = true;
    if (event.code === 'Escape' && !event.repeat) { clear(); onPause(); }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  function aimAt(event) {
    const rect = canvas.getBoundingClientRect();
    aim = { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  }
  canvas.addEventListener('pointermove', aimAt);
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true }); aimAt(event); mouseDown = true; attackQueued = true;
  });
  window.addEventListener('pointerup', () => { mouseDown = false; });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  return {
    clear,
    read: () => {
      const down = code => keys.has(code) || tapped.has(code);
      const result = { x: Number(down('KeyD') || down('ArrowRight')) - Number(down('KeyA') || down('ArrowLeft')), y: Number(down('KeyS') || down('ArrowDown')) - Number(down('KeyW') || down('ArrowUp')), attack: down('Space') || mouseDown || attackQueued, aim };
      tapped.clear(); attackQueued = false;
      return result;
    },
  };
}
