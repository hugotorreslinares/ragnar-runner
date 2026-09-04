// Image loading — the game keeps running from the moment these are declared;
// `allLoaded`/`useFallbackArt`/`bgLoaded`/`bgFailed` are read every frame by
// render.js rather than awaited, so a slow or blocked asset degrades the
// visuals instead of blocking the game.
import { SHEET, BACKGROUNDS } from './config.js';

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

// One entry per BACKGROUNDS definition. They are NOT all fetched at
// startup: each photo is a few hundred KB and most runs never reach the
// later ones, so a background is only requested when the renderer asks for
// it (see requestBackground). The first one is requested immediately since
// every run starts on it.
export const backgrounds = BACKGROUNDS.map(def => ({
  def,
  img: new Image(),
  loaded: false,
  failed: false,
  requested: false,
}));

// Start fetching a background. Safe to call every frame — it only acts once.
export function requestBackground(entry){
  if (entry.requested) return;
  entry.requested = true;
  entry.img.onload = () => { entry.loaded = true; };
  entry.img.onerror = () => { entry.failed = true; };
  entry.img.src = entry.def.src;
}

// Every run starts on the first one — unless the game ships none, which is
// allowed (the renderer paints stand-in scenery instead).
if (backgrounds.length) requestBackground(backgrounds[0]);

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
