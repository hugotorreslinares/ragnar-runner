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
import { drawArmoredVan } from "./armoredvan.js";
import { drawSleepingPerson } from "./sleepingperson.js";
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
  // Widest hitbox in the game. Height, not width, is what sets how hard this
  // is to clear: measured by sweeping jump-trigger distances at START_SPEED,
  // width 70 and 79 score identically, while height moves the timing window
  // sharply (h=62 → 16 usable trigger distances, h=70 → 11, h=78 → 6; the
  // dumpster scores 16). 64-70 lands it a notch harder than the dumpster
  // without becoming a reflex test, which suits the last type to unlock.
  // drawScale carries the visual bulk a van needs without spending hitbox.
  armoredvan: {
    minScore: 5000,
    weight: 0.08,
    size: () => ({ w: 76 + Math.random() * 6, h: 64 + Math.random() * 6 }),
    draw: drawArmoredVan,
    drawScale: 1.7,
  },
  // Widest hitbox in the game (up to 106), and still fair — because it's
  // low. Measured windows at START_SPEED: 90x46 -> 7, 100x46 -> 6,
  // 110x46 -> 6, 120x46 -> 4, against the dumpster's 6. Width barely costs
  // anything while height is cheap to stay under, which is exactly the
  // trade a lying-down silhouette makes. drawScale is 1 — the art already
  // fills its box.
  sleepingperson: {
    minScore: 2000,
    weight: 0.1,
    size: () => ({ w: 98 + Math.random() * 8, h: 44 + Math.random() * 4 }),
    draw: drawSleepingPerson,
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
