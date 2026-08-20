// Image loading — the game keeps running from the moment these are declared;
// `allLoaded`/`useFallbackArt`/`bgLoaded`/`bgFailed` are read every frame by
// render.js rather than awaited, so a slow or blocked asset degrades the
// visuals instead of blocking the game.
import { SHEET } from './config.js';

export const sheetImg = new Image();
export let allLoaded = false;
export let useFallbackArt = false;
sheetImg.onload = () => { allLoaded = true; };
sheetImg.onerror = () => { useFallbackArt = true; allLoaded = true; };
sheetImg.src = SHEET.src;
// Safety net: never let a stalled/blocked image load freeze the game.
setTimeout(() => {
  if (!allLoaded){ useFallbackArt = true; allLoaded = true; }
}, 2500);

export const bgImg = new Image();
export let bgLoaded = false, bgFailed = false;
bgImg.onload = () => { bgLoaded = true; };
bgImg.onerror = () => { bgFailed = true; };
bgImg.src = 'sprites/background-bogota.webp';

export const bgImg2 = new Image();
export let bg2Loaded = false, bg2Failed = false;
bgImg2.onload = () => { bg2Loaded = true; };
bgImg2.onerror = () => { bg2Failed = true; };
bgImg2.src = 'sprites/background.webp';

// Given an animation name + frame index, compute the source rect on the
// sheet. This is the one place that turns (row, frameIndex) into
// (sx, sy, sw, sh) — adding a new animation is a new row + SHEET.anims
// entry, never a new file or per-frame code.
export function sheetRect(animName, frameIndex){
  const a = SHEET.anims[animName];
  const idx = ((frameIndex % a.frameCount) + a.frameCount) % a.frameCount;
  return {
    sx: idx * SHEET.frameW,
    sy: a.row * SHEET.frameH,
    sw: SHEET.frameW,
    sh: SHEET.frameH,
  };
}
