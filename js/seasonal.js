// The seasonal layer *inside* the canvas — the counterpart to the CSS themes
// in style.css. Same source of truth (`activeTheme()`), so the page chrome and
// the game world always agree on the month.
//
// Everything here is drawn procedurally rather than shipped as art. Seasonal
// backgrounds would mean a full photographic set per month (the existing ones
// are ~150-450KB each) that most players would never see, and they would fight
// the score-driven stage progression in BACKGROUNDS. An overlay composites on
// top of whichever stage is current instead, so the two systems stay
// independent.
//
// No mutable game state lives here: particle positions are derived from the
// clock and a fixed seed table, so nothing needs updating, resetting between
// runs, or allocating per frame.
import { W, H, ctx } from "./dom.js";
import { GROUND_Y } from "./config.js";
import { activeTheme } from "./theme.js";

// Per-particle constants: phase offsets and speeds that keep the flock/field
// from moving as one block. Generated once at load.
function seeds(n, make) {
  return Array.from({ length: n }, (_, i) => make(i));
}

const BATS = seeds(4, () => ({
  speed: 26 + Math.random() * 26,
  phase: Math.random(),
  y: 40 + Math.random() * 110,
  bob: 10 + Math.random() * 18,
  flap: 5 + Math.random() * 4,
  scale: 0.7 + Math.random() * 0.6,
}));

const HEARTS = seeds(14, () => ({
  x: Math.random(),
  speed: 22 + Math.random() * 26,
  phase: Math.random(),
  sway: 12 + Math.random() * 26,
  size: 5 + Math.random() * 7,
}));

const FLAKES = seeds(70, () => ({
  x: Math.random(),
  speed: 26 + Math.random() * 60,
  phase: Math.random(),
  sway: 8 + Math.random() * 26,
  r: 1.2 + Math.random() * 2.4,
}));

// Wash tints. Kept at low alpha on purpose: the obstacles and the runner have
// to stay readable, and the photo backgrounds already carry the scene's mood.
const WASH = {
  halloween: { sky: "rgba(74, 30, 96, 0.30)", ground: "rgba(52, 20, 68, 0.28)" },
  amistad: { sky: "rgba(120, 32, 78, 0.22)", ground: "rgba(74, 22, 52, 0.22)" },
  navidad: { sky: "rgba(28, 62, 92, 0.24)", ground: "rgba(20, 44, 66, 0.22)" },
};

// The ground line picks this up so the horizon matches the theme instead of
// staying amber under a pink or green interface.
const GROUND_LINE = {
  halloween: "rgba(255,138,31,0.6)",
  amistad: "rgba(255,122,162,0.6)",
  navidad: "rgba(245,207,95,0.6)",
};

export function groundLineColor() {
  return GROUND_LINE[activeTheme()] || "rgba(232,171,58,0.55)";
}

function now() {
  return performance.now() / 1000;
}

function drawMoon() {
  const cx = W - 120;
  const cy = 92;
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 90);
  glow.addColorStop(0, "rgba(255, 226, 160, 0.45)");
  glow.addColorStop(1, "rgba(255, 226, 160, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 90, cy - 90, 180, 180);

  ctx.fillStyle = "#f6e4b4";
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  // Craters — flat shading, no gradient, so the disc keeps the game's
  // poster-like look instead of turning photographic.
  ctx.fillStyle = "rgba(196, 173, 126, 0.55)";
  for (const [dx, dy, r] of [[-11, -8, 7], [9, 4, 5], [-3, 13, 4]]) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBat(x, y, wing, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(16, 8, 22, 0.85)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  // wing sweep runs from -1 (folded up) to 1 (spread down)
  ctx.quadraticCurveTo(-9, -6 * wing, -18, 2 - 4 * wing);
  ctx.quadraticCurveTo(-10, 1, -5, 4);
  ctx.lineTo(5, 4);
  ctx.quadraticCurveTo(10, 1, 18, 2 - 4 * wing);
  ctx.quadraticCurveTo(9, -6 * wing, 0, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 2, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeart(x, y, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ff7aa2";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.5, y - size * 0.2, x - size * 0.5, y - size * 1.2, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.5, y - size * 1.2, x + size * 1.5, y - size * 0.2, x, y + size * 0.9);
  ctx.fill();
  ctx.restore();
}

// Drawn straight after the background, so the wash sits under the obstacles
// and the runner and never dulls them.
export function drawSeasonalBackdrop() {
  const theme = activeTheme();
  const wash = WASH[theme];
  if (!wash) return;

  ctx.save();
  ctx.fillStyle = wash.sky;
  ctx.fillRect(0, 0, W, GROUND_Y);
  ctx.fillStyle = wash.ground;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  if (theme === "halloween") {
    drawMoon();
    const t = now();
    for (const b of BATS) {
      // Wrap across a span wider than the canvas so a bat enters and leaves
      // off-screen instead of appearing at the edge.
      const span = W + 160;
      const x = ((t * b.speed + b.phase * span) % span) - 80;
      const y = b.y + Math.sin(t * 1.6 + b.phase * 6.283) * b.bob;
      drawBat(x, y, Math.sin(t * b.flap + b.phase * 6.283), b.scale);
    }
  }
  ctx.restore();
}

// Drawn late, in front of the runner: hearts and snow are between the camera
// and the scene, and the depth only reads if they occlude.
export function drawSeasonalForeground() {
  const theme = activeTheme();
  if (theme !== "amistad" && theme !== "navidad") return;
  const t = now();
  ctx.save();

  if (theme === "amistad") {
    for (const h of HEARTS) {
      const span = H + 80;
      // rising, so the travel is subtracted from the wrap
      const y = H + 40 - ((t * h.speed + h.phase * span) % span);
      const x = h.x * W + Math.sin(t * 0.9 + h.phase * 6.283) * h.sway;
      // fade in off the bottom edge and out again near the top
      const life = 1 - Math.abs((y / H) * 2 - 1);
      drawHeart(x, y, h.size, Math.max(0, Math.min(0.55, life)));
    }
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (const f of FLAKES) {
      const span = H + 40;
      const y = ((t * f.speed + f.phase * span) % span) - 20;
      const x = f.x * W + Math.sin(t * 0.7 + f.phase * 6.283) * f.sway;
      ctx.beginPath();
      ctx.arc(x, y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
