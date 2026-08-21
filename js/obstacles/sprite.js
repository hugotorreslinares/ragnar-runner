// Image-backed obstacles: a registry entry can carry a picture instead of a
// draw function, so adding an obstacle is a file plus six lines rather than
// three hundred lines of canvas calls.
//
// The image is decoded once and blitted every frame. That is also faster
// than painting paths — measured at ~1us per blit against 3-30us for the
// code-drawn obstacles — though at 2-3 obstacles on screen neither cost is
// close to mattering.
import { ctx } from "../dom.js";
import { GROUND_Y } from "../config.js";

const cache = new Map();

export function loadSprite(src) {
  let entry = cache.get(src);
  if (entry) return entry;
  entry = { img: new Image(), ready: false, failed: false };
  entry.img.onload = () => { entry.ready = true; };
  entry.img.onerror = () => { entry.failed = true; };
  entry.img.src = src;
  cache.set(src, entry);
  return entry;
}

// Width comes from the hitbox (times drawScale); height follows the image's
// own proportions rather than the hitbox's, so art is never stretched. The
// hitbox stays the gameplay truth — this only decides what is painted.
export function drawSprite(src, screenX, drawW, hitH) {
  const entry = loadSprite(src);
  if (!entry.ready) {
    // Never draw nothing: an invisible obstacle still costs a life. Until the
    // image arrives — or forever, if it 404s — show a block the size of the
    // hitbox so the thing that kills you is at least on screen.
    ctx.fillStyle = "#3b3f41";
    ctx.fillRect(screenX - drawW / 2, GROUND_Y - hitH, drawW, hitH);
    return;
  }
  const { naturalWidth: iw, naturalHeight: ih } = entry.img;
  const drawH = iw ? (drawW * ih) / iw : hitH;
  ctx.drawImage(entry.img, screenX - drawW / 2, GROUND_Y - drawH, drawW, drawH);
}
