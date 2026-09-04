// Bogotá's obstacle set — the content half of the obstacle system. The
// mechanics that consume this table (which type spawns, when, and how it is
// drawn) live in js/obstacles/index.js and know nothing about these entries;
// another game supplies its own table in the same shape and reuses all of it.
//
// Each entry:
//   minScore  — score the player must reach before this type can spawn at all
//   weight    — relative spawn frequency among the types currently unlocked
//               (weights are renormalized over whatever is unlocked, so the
//               ratios between already-available types stay fixed as new
//               ones unlock)
//   everyPoints — alternative to minScore/weight: this type is never picked
//               at random. It appears exactly once every N points of score,
//               so a hard obstacle stays a punctual event rather than
//               something the dice can throw twice in a row.
//   size()    — returns the collision box {w, h}; the hitbox is the source of
//               truth for gameplay
//   draw      — renderer from its own module, OR
//   image     — path to a picture to use instead of a draw function; the
//               easier way to add an obstacle. Width comes from the hitbox
//               (times drawScale) and the height follows the image's own
//               proportions, so the art is never stretched.
//   drawScale — visual width multiplier applied to w at draw time only. Some
//               art is drawn wider than its hitbox so the sprite reads well
//               while collisions stay forgiving; this never affects physics.
//   shatters  — see paradero: the obstacle stays anchored and only this
//               rectangle of it breaks off.
import { drawCrate } from "./crate.js";
import { drawBarrel } from "./barrel.js";
import { drawTrashcan } from "./trashcan.js";
import { drawDumpster } from "./dumpster.js";
import { drawArmoredVan } from "./armoredvan.js";
import { drawSleepingPerson } from "./sleepingperson.js";
import { drawOpenManholeTire } from "./openManholeTire.js";

// width / height of paradero.webp
const PARADERO_ASPECT = 300 / 165;

export const OBSTACLES = {
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
  // Bogotá bus shelter — the first obstacle made from a picture instead of a
  // draw function (see sprite.js), and the first whose hitbox is deliberately
  // NOT the drawn rectangle.
  //
  // The art is 1.818 wide for 1 tall, so "make the shelter twice as tall"
  // means drawing it twice as wide too: 190x105 instead of 95x52. A hitbox
  // that size is unjumpable — measured at START_SPEED, a 95-wide box stops
  // being clearable at all above h=70 (0 of 33 trigger distances at h=75),
  // and the jump apex is 112.5px, so no width clears h>=95. The shelter
  // therefore keeps a narrow, tall hitbox around its middle and lets the
  // canopy overhang and the open sides pass through — the same "art bigger
  // than hitbox" trade the crate (2x) and the armoured van (1.7x) already
  // make, just larger because the art is wide and the box must stay narrow.
  //
  // 48-50 x 76-79 measures 10-11 of 33 usable jump-trigger distances across
  // its whole jitter range — the same difficulty as the 95x52 hitbox it
  // replaces (10/33), against the dumpster's 14 and the armoured van's 7.
  // Height is what makes it unfair: at 52x82 it collapses to 4/33, which is
  // why the jitter here is deliberately tight.
  paradero: {
    // Scheduled, not rolled: one shelter per 1000 points. It is the hardest
    // obstacle in the game (see the measured windows above), so leaving it
    // to the weighted draw would let two land back to back and read as
    // unfair. Once per milestone also makes it a landmark the player can
    // feel coming.
    everyPoints: 1000,
    size: () => ({ w: 48 + Math.random() * 2, h: 76 + Math.random() * 3 }),
    image: "images/obstacles/paradero.webp",
    // ~190px of drawn width, i.e. ~105px tall: double the old 52.
    drawScale: 3.85,
    // The picture's own proportions. Needed because the hitbox no longer
    // carries them: anything that has to reason about the drawn rectangle
    // (panelRect) derives its height from drawW and this, never from o.h.
    aspect: PARADERO_ASPECT,
    // Bolted to the pavement: it does not fly apart on impact. Only the ad
    // panel's glass does, and the shelter stays standing with an empty frame.
    // The rectangle is the poster's own bounds inside the sprite, measured
    // from the image and stored as fractions so it survives a re-export at a
    // different resolution.
    shatters: { x: 0.7067, y: 0.297, w: 0.1533, h: 0.5939 },
  },
};