// Pure constants — no DOM access, no mutable game state. Safe to import from
// anywhere without pulling in side effects.

export const GROUND_Y = 390; // y coordinate of the ground line

// One real spritesheet: a uniform grid where every cell is exactly
// SHEET.frameW x SHEET.frameH. Switching animation = switching row +
// frame-count range; the pixel offset is always derived, never hand-authored.
export const SHEET = {
  src: 'sprites/spritesheet.png',
  frameW: 182,
  frameH: 193,
  anims: {
    run:  { row: 0, frameCount: 24 },
    jump: { row: 1, frameCount: 23 },
  },
};
// natural aspect ratio, used only by the vector fallback runner
export const FRAME_ASPECT = SHEET.frameW / SHEET.frameH;

export const GRAVITY = 0.80;
export const JUMP_VELOCITY = -13.6;
// Total airborne duration (in dt units, ~60fps frames) for a symmetric jump
// that launches at JUMP_VELOCITY and lands back at y=0. Used to scrub through
// the jump animation's frames in sync with the actual flight, not a fixed fps.
export const JUMP_TOTAL_FRAMES = 2 * Math.abs(JUMP_VELOCITY) / GRAVITY;

export const START_SPEED = 3.2; // baseSpeed at the moment a run starts
export const BASE_SPEED_CAP = 11.0; // top of the difficulty ramp; running speed can't exceed this on its own
export const MAX_LIVES = 5;
export const STARS_PER_LIFE = 10;

// Stars float at jump height and can only be caught mid-air (see the
// collision block in game.js's update()). Radius doubles as the difficulty
// knob: bigger stars sit low and give a wide catch window (easy), smaller
// ones sit near the jump apex with a tight window (hard).
export const STAR_TIERS = [
  { weight: 0.45, offsetMin: 30, offsetMax: 55, r: 17 },  // easy: low, forgiving
  { weight: 0.35, offsetMin: 65, offsetMax: 85, r: 14 },  // medium
  { weight: 0.20, offsetMin: 95, offsetMax: 112, r: 10 }, // hard: near max jump height
];

// City background photo: aligned so the row where its curb meets the road
// (roadSrcY, in source-image pixels) lands exactly on GROUND_Y. Past
// BG_SWITCH_SCORE the scenery swaps to the Bogotá skyline for the rest of
// the run — both photos use the same mirrored infinite-tiling trick.
export const BG_SWITCH_SCORE = 4000;
export const BG_ROAD_SRC_Y = 782;
export const BG_ROAD_SRC_Y_2 = 795;
