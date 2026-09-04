// The jungle's canvas art. Every piece here is drawn in code, which is the
// point of this pack: it is a working game with no image or audio files at
// all, so the engine can be seen running something that is not Bogotá.
//
// Replacing any of it with real art is a local change — drop a spritesheet in
// GAME.sheet and the runner below stops being used; add background photos and
// drawFallbackScenery stops being called.
import { ctx } from "../../dom.js";

export const PALETTE = {
  groundTop: "#4a5c31",
  groundBottom: "#22301a",
  groundTicks: "rgba(255,255,255,0.07)",
  groundLine: "rgba(180,220,120,0.55)",
  haze: "24,36,20",
  accent: "#f2c14e",
  fallbackSkyTop: "#9ec27a",
  fallbackSkyBottom: "#3c6136",
  fallbackBuildings: "rgba(22, 46, 26, 0.55)",
  damage: "196,69,58",
  text: "#ffffff",
  textDim: "#e9e4d6",
};

// Canopy in the distance: trunks with a mass of leaves on top, scrolling
// slower than the foreground. Same job as Bogotá's skyline — say where we are
// without pulling the eye off the obstacles.
export function drawFallbackScenery(scrollX, width, groundY) {
  const spacing = 210;
  const offset = -(scrollX * 0.15) % spacing;
  for (let x = offset - spacing; x < width + spacing; x += spacing) {
    ctx.fillStyle = "rgba(28, 54, 30, 0.75)";
    ctx.fillRect(x + 40, 150, 16, groundY - 150);
    ctx.fillRect(x + 140, 180, 12, groundY - 180);

    ctx.fillStyle = PALETTE.fallbackBuildings;
    ctx.beginPath();
    ctx.ellipse(x + 48, 150, 74, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 146, 178, 56, 32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A band of undergrowth so the trunks do not float on the ground line.
  ctx.fillStyle = "rgba(30, 58, 32, 0.55)";
  ctx.fillRect(0, groundY - 26, width, 26);
}

// The collectible: a banana, filling the same radius the engine reserves for
// a star, so the catch window is unchanged.
export function drawStar(x, y, r, bob) {
  const yy = y + Math.sin(bob) * 5;
  ctx.save();
  ctx.translate(x, yy);
  ctx.rotate(Math.sin(bob * 0.6) * 0.15);
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.35);
  ctx.quadraticCurveTo(0, r * 1.15, r, -r * 0.35);
  ctx.quadraticCurveTo(0, r * 0.5, -r, -r * 0.35);
  ctx.closePath();
  ctx.fillStyle = PALETTE.accent;
  ctx.shadowColor = "rgba(242,193,78,0.7)";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#8a6a26";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Debris is drawn centred on (0,0): the caller has already translated and
// rotated it.
export function drawDebrisPiece(d) {
  const w = d.w;
  const h = d.h;
  const top = -h / 2;
  ctx.fillStyle = d.type === "rock" ? "#6b6560" : "#5d3f26";
  ctx.fillRect(-w / 2, top, w, h);
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, top, w, h);
}

// The runner. This pack ships no spritesheet, so unlike Bogotá's this is not
// a fallback that players never see — it *is* the character, and the engine
// reaches it through the same GAME.art.fallbackRunner hook.
export function drawFallbackRunner(feetY, topY, drawH, drawW, phase) {
  const cx = 0;
  const legSwing = Math.sin(phase) * drawW * 0.3;
  const armSwing = Math.sin(phase + Math.PI) * drawW * 0.34;
  const hipY = topY + drawH * 0.68;
  const shoulderY = topY + drawH * 0.3;
  const headR = drawH * 0.12;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(4, drawW * 0.13);

  // Legs — short and wide apart, which is most of what makes a silhouette
  // read as an ape rather than a person.
  ctx.strokeStyle = "#2b2320";
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - legSwing, feetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + legSwing, feetY);
  ctx.stroke();

  // Torso: a heavy barrel, widest at the shoulders.
  ctx.fillStyle = "#3a2f2a";
  ctx.beginPath();
  ctx.moveTo(cx - drawW * 0.26, shoulderY);
  ctx.quadraticCurveTo(cx - drawW * 0.34, hipY, cx, hipY + drawH * 0.02);
  ctx.quadraticCurveTo(cx + drawW * 0.34, hipY, cx + drawW * 0.26, shoulderY);
  ctx.quadraticCurveTo(cx, shoulderY - drawH * 0.08, cx - drawW * 0.26, shoulderY);
  ctx.fill();

  // Arms, long enough to reach past the hips.
  ctx.strokeStyle = "#3a2f2a";
  ctx.beginPath();
  ctx.moveTo(cx - drawW * 0.18, shoulderY + drawH * 0.04);
  ctx.lineTo(cx - drawW * 0.2 - armSwing, hipY + drawH * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + drawW * 0.18, shoulderY + drawH * 0.04);
  ctx.lineTo(cx + drawW * 0.2 + armSwing, hipY + drawH * 0.12);
  ctx.stroke();

  // Head, set low between the shoulders.
  ctx.fillStyle = "#332a26";
  ctx.beginPath();
  ctx.arc(cx + drawW * 0.06, shoulderY - headR * 0.5, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b5344";
  ctx.beginPath();
  ctx.ellipse(cx + drawW * 0.14, shoulderY - headR * 0.35, headR * 0.5, headR * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
