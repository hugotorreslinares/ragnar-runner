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

// Defaults below were arrived at by playtesting live via the ?admin panel
// (js/admin.js / js/tuning.js) — these are the values that made the game
// feel playable/fun again, not arbitrary starting guesses. Jump duration
// (dt-units, ~60fps frames) is derived from GRAVITY/JUMP_VELOCITY at
// runtime — see jumpTotalFrames() in tuning.js — since both are tunable.
export const GRAVITY = 1.0;
export const JUMP_VELOCITY = -15;

export const START_SPEED = 8.6; // baseSpeed at the moment a run starts
export const BASE_SPEED_CAP = 9.0; // top of the difficulty ramp; running speed can't exceed this on its own
// baseSpeed climbs from START_SPEED to BASE_SPEED_CAP at this rate per dt
// unit (~60 units/real-second) — (CAP-START)/RATE = frames to reach max.
export const RAMP_RATE = 0.018;
// A jump's horizontal reach is curSpeed * jumpTotalFrames() — below this
// speed, that reach drops under the widest obstacle's width, so a
// correctly-timed jump can still land on top of it. Never let curSpeed sit
// below this (game start, "slow down" input, post-hit stumble).
export const MIN_SAFE_SPEED = 4.7;
export const JUMP_SPEED_MULT = 1.1; // while airborne, world scroll speed is curSpeed * this
export const MAX_LIVES = 5;
export const STARS_PER_LIFE = 10;

// Stars float at jump height and can only be caught mid-air (see the
// collision block in game.js's update()). Radius doubles as the difficulty
// knob: bigger stars sit low and give a wide catch window (easy), smaller
// ones sit near the jump apex with a tight window (hard).
export const STAR_TIERS = [
  { weight: 0.15, offsetMin: 90, offsetMax: 100, r: 12 },  // easy: low, forgiving
  { weight: 0.25, offsetMin: 85, offsetMax: 115, r: 14 },  // medium
  { weight: 0.20, offsetMin: 95, offsetMax: 112, r: 10 }, // hard: near max jump height
];

// City background photo: aligned so the row where its curb meets the road
// (roadSrcY, in source-image pixels) lands exactly on GROUND_Y. Past
// BG_SWITCH_SCORE the scenery swaps to the Bogotá skyline for the rest of
// the run — both photos use the same mirrored infinite-tiling trick.
export const BG_SWITCH_SCORE = 4000;
export const BG_ROAD_SRC_Y = 782;
export const BG_ROAD_SRC_Y_2 = 795;
