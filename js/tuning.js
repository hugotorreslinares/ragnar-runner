// Live-tunable copies of the gameplay constants that most affect feel —
// seeded from config.js's defaults. game.js/entities.js/state.js read these
// (TUNE.xxx) instead of the config.js constants directly, so the admin
// panel (?admin in the URL, see admin.js) can adjust them at runtime
// without a reload — mutating a property on this shared object is visible
// to every module that imported TUNE, since they all hold the same
// reference. Keep this separate from config.js: config.js holds the
// *default* values and anything structural that isn't meant to be
// live-tweaked (sprite geometry, background alignment, star tiers, etc).
import {
  GRAVITY, JUMP_VELOCITY, START_SPEED, BASE_SPEED_CAP, RAMP_RATE,
  MIN_SAFE_SPEED, JUMP_SPEED_MULT, MAX_LIVES, STARS_PER_LIFE,
} from './config.js';

export const TUNE = {
  GRAVITY,
  JUMP_VELOCITY,
  START_SPEED,
  BASE_SPEED_CAP,
  RAMP_RATE,
  MIN_SAFE_SPEED,
  JUMP_SPEED_MULT,
  MAX_LIVES,
  STARS_PER_LIFE,
};

// JUMP_TOTAL_FRAMES used to be a precomputed constant; now that GRAVITY and
// JUMP_VELOCITY can change at runtime it has to be derived fresh each time
// instead of frozen at module load.
export function jumpTotalFrames(){
  return 2 * Math.abs(TUNE.JUMP_VELOCITY) / TUNE.GRAVITY;
}
