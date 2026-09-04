// Bogotá's canvas art: the pieces of the drawing that are about *this* game
// rather than about running-and-jumping. render.js owns the scene (what is on
// screen, where, in which order) and calls into these through GAME.art, so a
// jungle or skate-park game replaces this file and leaves the renderer alone.
//
// Every function draws in the coordinate space the renderer has already set
// up — the caller has translated/rotated where needed — so nothing here reads
// game state or the scroll position.
import { ctx } from "../../dom.js";
import { roundRect } from "../../obstacles/utils.js";

// Colours of the scene furniture the renderer paints itself: the road under
// the runner, the line where it meets the scenery, and the tick marks that
// give the ground its sense of speed.
export const PALETTE = {
  groundTop: "#2c3438",
  groundBottom: "#181e20",
  groundTicks: "rgba(255,255,255,0.08)",
  // Horizon line; seasonal themes override it (js/seasonal.js).
  groundLine: "rgba(232,171,58,0.55)",
  haze: "20,26,28",
  accent: "#e8ab3a",
  fallbackSkyTop: "#61787f",
  fallbackSkyBottom: "#33454b",
  fallbackBuildings: "rgba(20,28,31,0.55)",
  // Full-screen pulse on a hit, as "r,g,b" — the renderer supplies the alpha.
  damage: "196,69,58",
  text: "#ffffff",
  textDim: "#e9e4d6",
};

// The collectible. Named `star` in the engine because that is the role, not
// the picture: another game can draw a banana or a skate wheel here as long
// as it fills the same radius.
export function drawStar(x, y, r, bob) {
  const yy = y + Math.sin(bob) * 5;
  ctx.save();
  ctx.translate(x, yy);
  ctx.rotate(Math.sin(bob * 0.6) * 0.15);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = -Math.PI / 2 + i * ((Math.PI * 2) / 5);
    const innerA = outerA + Math.PI / 5;
    ctx.lineTo(Math.cos(outerA) * r, Math.sin(outerA) * r);
    ctx.lineTo(Math.cos(innerA) * r * 0.42, Math.sin(innerA) * r * 0.42);
  }
  ctx.closePath();
  ctx.fillStyle = "#e8ab3a";
  ctx.shadowColor = "rgba(232,171,58,0.7)";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#8a6a26";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Same crate/barrel look as drawCrate/drawBarrel, but centered on (0,0) so
// the caller can translate+rotate it freely — used for flying debris.
export function drawDebrisPiece(d) {
  const w = d.w,
    h = d.h,
    top = -h / 2;
  if (d.type === "glass") {
    // Pale, translucent, hard-edged: reads as glass at 4-8px where a tumbling
    // grey box would just read as more rubble.
    ctx.beginPath();
    ctx.moveTo(d.shape[0][0] * w, d.shape[0][1] * h);
    for (let i = 1; i < d.shape.length; i++) {
      ctx.lineTo(d.shape[i][0] * w, d.shape[i][1] * h);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(198, 231, 240, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245, 253, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }
  if (d.type === "crate") {
    ctx.fillStyle = "#6b4a2b";
    ctx.fillRect(-w / 2, top, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(-w / 2, top, w, 6);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + (w / 3) * i, top);
      ctx.lineTo(-w / 2 + (w / 3) * i, top + h);
      ctx.stroke();
    }
    ctx.strokeStyle = "#2b1c10";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, top, w, h);
  } else {
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, "#2a2f33");
    grad.addColorStop(0.5, "#4d565b");
    grad.addColorStop(1, "#22262a");
    ctx.fillStyle = grad;
    roundRect(-w / 2, top, w, h, w * 0.28);
    ctx.fill();
    ctx.fillStyle = "#e8ab3a";
    ctx.fillRect(-w / 2, top + h * 0.22, w, h * 0.09);
    ctx.fillRect(-w / 2, top + h * 0.62, w, h * 0.09);
    ctx.strokeStyle = "#0e1113";
    ctx.lineWidth = 2;
    roundRect(-w / 2, top, w, h, w * 0.28);
    ctx.stroke();
  }
}

export function drawFallbackRunner(feetY, topY, drawH, drawW, phase, facing) {
  // A simple, readable vector runner used only if the sprite art fails to load.
  ctx.save();
  ctx.translate(0, 0);
  const cx = 0;
  const legSwing = Math.sin(phase) * drawW * 0.28;
  const armSwing = Math.sin(phase + Math.PI) * drawW * 0.22;
  const bodyTop = topY + drawH * 0.28;
  const bodyBot = topY + drawH * 0.72;
  const hipY = bodyBot;
  const headR = drawH * 0.13;

  ctx.strokeStyle = "#e9e4d6";
  ctx.fillStyle = "#c9a876";
  ctx.lineWidth = Math.max(3, drawW * 0.09);
  ctx.lineCap = "round";

  // back leg
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - legSwing, feetY);
  ctx.strokeStyle = "#2c2440";
  ctx.stroke();
  // front leg
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + legSwing, feetY);
  ctx.strokeStyle = "#3a2f56";
  ctx.stroke();

  // torso
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + drawW * 0.05, bodyTop);
  ctx.strokeStyle = "#c9a876";
  ctx.stroke();

  // back arm
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + drawH * 0.06);
  ctx.lineTo(cx - armSwing, bodyTop + drawH * 0.22);
  ctx.strokeStyle = "#b3906a";
  ctx.stroke();
  // front arm
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + drawH * 0.06);
  ctx.lineTo(cx + armSwing, bodyTop + drawH * 0.22);
  ctx.strokeStyle = "#c9a876";
  ctx.stroke();

  // head
  ctx.beginPath();
  ctx.fillStyle = "#c9a876";
  ctx.arc(cx + drawW * 0.05, bodyTop - headR * 0.6, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a26";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}
