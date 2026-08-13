// Raw input capture — keyboard + touch. Nothing here knows about game
// phase/flow (starting, pausing); that wiring lives in main.js.
import { isFormControlFocused } from './dom.js';

export const keys = { left: false, right: false, up: false };

let jumpQueued = false;
export function queueJump(){ jumpQueued = true; }
// Buffered: a jump pressed slightly before landing should still fire on
// landing, not get silently dropped. hasQueuedJump() only *reads* the flag —
// the caller must call clearQueuedJump() itself, and only when the jump was
// actually applied (i.e. the player was on the ground). Clearing it
// unconditionally every frame (as a single "consume" call used to) discards
// a jump pressed while airborne before it ever gets a chance to land.
export function hasQueuedJump(){ return jumpQueued; }
export function clearQueuedJump(){ jumpQueued = false; }
export function clearInput(){
  keys.left = keys.right = keys.up = false;
  jumpQueued = false;
}

function setKey(code, val){
  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = val;
  else if (code === 'ArrowRight' || code === 'KeyD') keys.right = val;
  else if (code === 'ArrowUp' || code === 'Space' || code === 'KeyW') {
    if (val && !keys.up) queueJump();
    keys.up = val;
  }
}
window.addEventListener('keydown', e => {
  if (isFormControlFocused()) return;
  if (['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code)) e.preventDefault();
  setKey(e.code, true);
});
window.addEventListener('keyup', e => {
  if (isFormControlFocused()) return;
  setKey(e.code, false);
});

function bindTouch(id, onDown, onUp){
  const el = document.getElementById(id);
  const down = e => { e.preventDefault(); onDown(); };
  const up = e => { e.preventDefault(); onUp(); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
}
bindTouch('btnLeft', () => keys.left = true, () => keys.left = false);
bindTouch('btnRight', () => keys.right = true, () => keys.right = false);
bindTouch('btnJump', () => queueJump(), () => {});
