const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

export function pointerToWorld(event, bounds, world) {
  if (!(bounds.width > 0 && bounds.height > 0)) return null;
  const x = (event.clientX - bounds.left) * world.width / bounds.width;
  const y = (event.clientY - bounds.top) * world.height / bounds.height;
  return x >= 0 && x <= world.width && y >= 0 && y <= world.height ? { x, y } : null;
}

export function createInput(canvas, world, target = window) {
  const keys = new Set();
  let enabled = false;
  let primaryHeld = false;
  let pointer = null;
  const listeners = [];
  const listen = (element, name, handler) => {
    element.addEventListener(name, handler);
    listeners.push(() => element.removeEventListener(name, handler));
  };
  const clear = () => { keys.clear(); primaryHeld = false; };
  const editable = element => element?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(element?.tagName);
  listen(target, 'keydown', event => {
    if (!enabled || editable(event.target)) return;
    if (MOVEMENT_KEYS.has(event.code) || event.code === 'Space') {
      event.preventDefault(); keys.add(event.code);
    }
  });
  listen(target, 'keyup', event => { keys.delete(event.code); });
  listen(target, 'blur', clear);
  listen(target, 'pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const point = pointerToWorld(event, canvas.getBoundingClientRect(), world);
    if (point) pointer = point;
  });
  listen(canvas, 'pointerdown', event => {
    if (!enabled || event.button !== 0) return;
    const point = pointerToWorld(event, canvas.getBoundingClientRect(), world);
    if (!point) return;
    pointer = point; primaryHeld = true; event.preventDefault(); canvas.focus({ preventScroll: true });
  });
  listen(target, 'pointerup', event => { if (event.button === 0) primaryHeld = false; });
  listen(target, 'pointercancel', clear);
  return {
    clear,
    setEnabled(value) { if (enabled !== value) clear(); enabled = value; },
    sample() {
      if (!enabled) return {};
      const has = (a, b) => keys.has(a) || keys.has(b);
      return {
        moveX: Number(has('KeyD', 'ArrowRight')) - Number(has('KeyA', 'ArrowLeft')),
        moveY: Number(has('KeyS', 'ArrowDown')) - Number(has('KeyW', 'ArrowUp')),
        ...(pointer ? { aimX: pointer.x, aimY: pointer.y } : {}),
        attack: keys.has('Space') || primaryHeld,
      };
    },
    pointer() { return pointer ? { ...pointer } : null; },
    destroy() { clear(); listeners.forEach(remove => remove()); },
  };
}
