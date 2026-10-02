import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../input.js';

test('physical controls sustain and release, buffer taps, aim with scaled mouse, and clear on blur', () => {
  const windowHandlers = {};
  const canvasHandlers = {};
  globalThis.window = { addEventListener: (name, fn) => { windowHandlers[name] = fn; } };
  globalThis.document = { addEventListener() {} };
  globalThis.HTMLInputElement = class {};
  globalThis.HTMLButtonElement = class {};
  const canvas = { addEventListener: (name, fn) => { canvasHandlers[name] = fn; }, focus() {}, getBoundingClientRect: () => ({ left: 10, top: 20, width: 560, height: 320 }) };
  let pauses = 0;
  const input = createInput(canvas, () => pauses++);
  const key = code => ({ code, target: canvas, preventDefault() {} });
  for (const [code, x, y] of [['KeyW',0,-1],['KeyA',-1,0],['KeyS',0,1],['KeyD',1,0],['ArrowUp',0,-1],['ArrowLeft',-1,0],['ArrowDown',0,1],['ArrowRight',1,0]]) {
    windowHandlers.keydown(key(code));
    for (let i=0;i<3;i++) { const sample=input.read(); assert.equal(sample.x,x); assert.equal(sample.y,y); }
    windowHandlers.keyup(key(code)); assert.equal(input.read().x,0); assert.equal(input.read().y,0);
  }
  windowHandlers.keydown(key('KeyD')); windowHandlers.keydown(key('KeyS')); assert.deepEqual([input.read().x,input.read().y],[1,1]); input.clear();
  windowHandlers.keydown(key('KeyW')); windowHandlers.keyup(key('KeyW')); assert.equal(input.read().y,-1); assert.equal(input.read().y,0);
  windowHandlers.keydown(key('Space')); windowHandlers.keyup(key('Space')); assert.equal(input.read().attack,true); assert.equal(input.read().attack,false);
  canvasHandlers.pointerdown({button:0,clientX:290,clientY:180,preventDefault(){}});
  assert.deepEqual(input.read().aim,{x:560,y:320}); assert.equal(input.read().attack,true);
  windowHandlers.pointerup(); assert.equal(input.read().attack,false);
  canvasHandlers.pointerdown({button:0,clientX:290,clientY:180,preventDefault(){}}); windowHandlers.pointerup(); assert.equal(input.read().attack,true);
  windowHandlers.keydown(key('KeyD')); windowHandlers.blur(); assert.equal(input.read().x,0);
  windowHandlers.keydown(key('Escape')); assert.equal(pauses,1);
  delete globalThis.window; delete globalThis.document; delete globalThis.HTMLInputElement; delete globalThis.HTMLButtonElement;
});
