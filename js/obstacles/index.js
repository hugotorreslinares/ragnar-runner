// The obstacle system's mechanics — which type spawns, when, and how one is
// drawn. Entirely game-agnostic: it reads whatever table the active game
// supplies (GAME.obstacles) and never enumerates types itself, so a game with
// jungle vines or skate rails reuses this file untouched.
//
// The table's shape is documented where a game defines it, e.g.
// js/games/bogota/obstacles/index.js.
import { drawSprite, loadSprite } from "./sprite.js";
import { ctx } from "../dom.js";
import { GROUND_Y } from "../config.js";
import { GAME } from "../active-game.js";

export const OBSTACLE_TYPES = GAME.obstacles;


// Weighted pick among the types unlocked at this score. Score is passed in
// rather than read off global state so the rule stays testable and the
// caller decides what "current score" means. Types on a fixed schedule
// (everyPoints) are excluded here — dueMilestoneType owns those.
export function pickObstacleType(score) {
  const available = Object.entries(OBSTACLE_TYPES).filter(
    ([, def]) => !def.everyPoints && score >= def.minScore,
  );

  const totalWeight = available.reduce((sum, [, def]) => sum + def.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const [type, def] of available) {
    if (roll < def.weight) return type;
    roll -= def.weight;
  }
  // float rounding can leave roll just past the last bucket
  return available[available.length - 1][0];
}

// Returns the scheduled type whose next milestone this score has just
// crossed, or null. `seen` maps type -> last milestone number already
// spawned; the caller owns it (it is per-run state) and must record the new
// milestone, otherwise the same one spawns on every call.
export function dueMilestoneType(score, seen) {
  for (const [type, def] of Object.entries(OBSTACLE_TYPES)) {
    if (!def.everyPoints) continue;
    const milestone = Math.floor(score / def.everyPoints);
    if (milestone >= 1 && milestone > (seen[type] || 0)) return type;
  }
  return null;
}

export function milestoneOf(type, score) {
  return Math.floor(score / OBSTACLE_TYPES[type].everyPoints);
}

export function drawObstacle(o, screenX) {
  const def = OBSTACLE_TYPES[o.type];
  const drawW = o.w * def.drawScale;
  if (def.image) drawSprite(def.image, screenX, drawW, o.h);
  else def.draw(screenX, drawW, o.h);
  if (o.wrecked && def.shatters) drawEmptyFrame(o, screenX);
}

// Screen-space rectangle of an obstacle's `shatters` panel. The panel's
// fractions are fractions of the *drawn* picture, not of the hitbox — those
// are two different rectangles now (see paradero) — so the height comes from
// drawW and the art's aspect. Both the glass spawn (entities.js) and the
// blacked-out frame below go through here, so the shards and the hole they
// leave can never drift apart.
export function panelRect(o, screenX) {
  const def = OBSTACLE_TYPES[o.type];
  const panel = def.shatters;
  const drawW = o.w * def.drawScale;
  const drawH = def.aspect ? drawW / def.aspect : o.h;
  return {
    left: screenX - drawW / 2 + panel.x * drawW,
    top: GROUND_Y - drawH + panel.y * drawH,
    w: panel.w * drawW,
    h: panel.h * drawH,
  };
}

// After the glass has gone, black out the panel so the shelter reads as
// damaged rather than untouched — otherwise the only trace of the crash is
// shards that have already faded.
function drawEmptyFrame(o, screenX) {
  const { left, top, w, h } = panelRect(o, screenX);
  ctx.fillStyle = "rgba(14, 17, 19, 0.92)";
  ctx.fillRect(left, top, w, h);
  // a few teeth of glass still in the frame
  ctx.fillStyle = "rgba(198, 231, 240, 0.5)";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left + w, top);
  ctx.lineTo(left + w * 0.72, top + h * 0.16);
  ctx.lineTo(left + w * 0.45, top + h * 0.05);
  ctx.lineTo(left + w * 0.2, top + h * 0.19);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(left, top + h);
  ctx.lineTo(left + w, top + h);
  ctx.lineTo(left + w * 0.66, top + h * 0.88);
  ctx.lineTo(left + w * 0.3, top + h * 0.95);
  ctx.closePath();
  ctx.fill();
}

// Decode every obstacle picture up front. They are a few KB each, and a
// first spawn that arrives before its image would show the placeholder block.
for (const def of Object.values(OBSTACLE_TYPES)) {
  if (def.image) loadSprite(def.image);
}
