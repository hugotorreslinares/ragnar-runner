// One place that reads the DOM — every other module imports element refs
// from here instead of calling document.getElementById itself.

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const W = canvas.width, H = canvas.height;

export const scoreVal = document.getElementById('scoreVal');
export const bestVal = document.getElementById('bestVal');
export const livesWrap = document.getElementById('lives');
export const starsVal = document.getElementById('starsVal');
export const livesMiniWrap = document.getElementById('livesMini');
export const starsMini = document.getElementById('starsMini');
export const speedVal = document.getElementById('speedVal');
export const speedMini = document.getElementById('speedMini');
export const startOverlay = document.getElementById('startOverlay');
export const overOverlay = document.getElementById('overOverlay');
export const overText = document.getElementById('overText');
export const startBtn = document.getElementById('startBtn');
export const restartBtn = document.getElementById('restartBtn');
export const lbStartList = document.getElementById('lbStartList');
export const lbOverList = document.getElementById('lbOverList');
export const lbNameInput = document.getElementById('lbNameInput');
export const lbSubmitBtn = document.getElementById('lbSubmitBtn');
export const pauseOverlay = document.getElementById('pauseOverlay');
export const pauseBtn = document.getElementById('pauseBtn');
export const resumeBtn = document.getElementById('resumeBtn');

// Global game keys (Space/Enter/ArrowUp/Escape) must not fire while the
// user is focused on ANY form control, not just the name input — Space or
// Enter on a focused button (e.g. "Submit Score") should activate that
// button, not restart the game. Checking a single named element misses
// every other focusable control on the overlays.
const FORM_TAGS = new Set(['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT']);
export function isFormControlFocused(){
  return FORM_TAGS.has(document.activeElement?.tagName);
}
