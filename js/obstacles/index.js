// Central obstacle registry — the ONE place that knows what obstacle types
// exist. Spawning (entities.js) and rendering (render.js) both read from
// here, so neither needs an if/else chain over types, and adding a new
// obstacle is: write its draw function, then add one entry below.
//
// Each entry:
//   minScore  — score the player must reach before this type can spawn at all
//   weight    — relative spawn frequency among the types currently unlocked
//               (weights are renormalized over whatever is unlocked, so the
//               ratios between already-available types stay fixed as new
//               ones unlock)
//   size()    — returns the collision box {w, h}; the hitbox is the source of
//               truth for gameplay
//   draw      — renderer from its own module
//   drawScale — visual width multiplier applied to w at draw time only. Some
//               art is drawn wider than its hitbox so the sprite reads well
//               while collisions stay forgiving; this never affects physics.
import { drawCrate } from "./crate.js";
import { drawBarrel } from "./barrel.js";
import { drawTrashcan } from "./trashcan.js";
import { drawDumpster } from "./dumpster.js";
import { drawOpenManholeTire } from "./openManholeTire.js";

export const OBSTACLE_TYPES = {
  crate: {
    minScore: 0,
    weight: 0.4,
    size: () => {
      const w = 42 + Math.random() * 14;
      return { w, h: w };
    },
    draw: drawCrate,
    drawScale: 2,
  },
  barrel: {
    minScore: 0,
    weight: 0.35,
    size: () => ({ w: 34, h: 54 + Math.random() * 14 }),
    draw: drawBarrel,
    drawScale: 1,
  },
  trashcan: {
    minScore: 1500,
    weight: 0.15,
    size: () => ({ w: 44 + Math.random() * 4, h: 68 + Math.random() * 6 }),
    draw: drawTrashcan,
    drawScale: 1,
  },
  dumpster: {
    minScore: 2500,
    weight: 0.1,
    size: () => ({ w: 58 + Math.random() * 6, h: 62 + Math.random() * 5 }),
    draw: drawDumpster,
    drawScale: 2,
  },
  openManholeTire: {
    minScore: 3500,
    weight: 0.15,
    size: () => ({ w: 70 + Math.random() * 10, h: 20 + Math.random() * 5 }),
    draw: drawOpenManholeTire,
    drawScale: 1,
  },
};

// Weighted pick among the types unlocked at this score. Score is passed in
// rather than read off global state so the rule stays testable and the
// caller decides what "current score" means.
export function pickObstacleType(score) {
  const available = Object.entries(OBSTACLE_TYPES).filter(
    ([, def]) => score >= def.minScore,
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

export function drawObstacle(o, screenX) {
  const def = OBSTACLE_TYPES[o.type];
  def.draw(screenX, o.w * def.drawScale, o.h);
}
