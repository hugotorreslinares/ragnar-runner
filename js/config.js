// The engine's view of the active game. Every constant below is read from
// GAME (js/active-game.js) rather than written here, so the engine keeps
// importing stable names while the values belong to whichever game is
// running.
//
// Nothing game-specific may be added to this file — no sprite path, no
// colour, no copy. If a new constant is needed, it goes in the game pack and
// gets surfaced here.
import { GAME } from './active-game.js';

export const GROUND_Y = GAME.layout.groundY; // y coordinate of the ground line
export const PLAYER_SCREEN_X = GAME.layout.playerScreenX;
export const PLAYER_DRAW_HEIGHT = GAME.layout.playerDrawHeight;

export const SHEET = GAME.sheet;
// natural aspect ratio, used only by the vector fallback runner
export const FRAME_ASPECT = SHEET.frameW / SHEET.frameH;

export const {
  GRAVITY, JUMP_VELOCITY, START_SPEED, BASE_SPEED_CAP, RAMP_RATE,
  MIN_SAFE_SPEED, JUMP_SPEED_MULT, MAX_LIVES, STARS_PER_LIFE,
} = GAME.physics;

export const STAR_TIERS = GAME.starTiers;
export const BACKGROUNDS = GAME.backgrounds;

// The last entry whose minScore the player has passed wins, which is why
// BACKGROUNDS must stay sorted ascending.
export function backgroundIndexForScore(score) {
  let idx = 0;
  for (let i = 0; i < BACKGROUNDS.length; i++) {
    if (score >= BACKGROUNDS[i].minScore) idx = i;
  }
  return idx;
}
