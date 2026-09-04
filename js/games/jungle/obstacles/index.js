// The jungle's obstacle set. Same shape as any other game's table — the
// mechanics in js/obstacles/index.js consume it without knowing a log from a
// bus shelter. The field-by-field documentation lives in
// js/games/bogota/obstacles/index.js.
//
// SKELETON: these three are drawn in code so the game runs with no art at
// all. Replacing any of them with a picture is swapping `draw` for
// `image: "images/jungle/<name>.webp"` — the hitbox and everything else stays.
//
// The sizes are copied from Bogotá's measured equivalents rather than
// invented: the log matches the crate's box, the rock the sleeping person's
// low-and-wide trade, the mound the trashcan. Those numbers came out of
// jump-window sweeps, so the jumps stay fair until this game gets swept on
// its own.
import { drawLog } from "./log.js";
import { drawRock } from "./rock.js";
import { drawTermiteMound } from "./termiteMound.js";

export const OBSTACLES = {
  log: {
    minScore: 0,
    weight: 0.45,
    size: () => {
      const w = 42 + Math.random() * 14;
      return { w, h: w };
    },
    draw: drawLog,
    drawScale: 1.6,
  },
  rock: {
    minScore: 0,
    weight: 0.35,
    size: () => ({ w: 70 + Math.random() * 10, h: 42 + Math.random() * 4 }),
    draw: drawRock,
    drawScale: 1.2,
  },
  termiteMound: {
    minScore: 1500,
    weight: 0.2,
    size: () => ({ w: 44 + Math.random() * 4, h: 68 + Math.random() * 6 }),
    draw: drawTermiteMound,
    drawScale: 1.3,
  },
};
