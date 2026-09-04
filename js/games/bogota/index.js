// "Escape from Bogotá" — the content pack. Everything that makes the engine
// *this* game rather than a gorilla in the jungle or a skater downtown lives
// here or in the files this one pulls together: art, copy, audio, obstacle
// table, scenery, and the numbers that set how it feels.
//
// The rule that keeps the split honest: the engine imports this, never the
// other way round. Nothing under js/ outside js/games/ may name a sprite, a
// sound file, a colour, or a line of copy. To build a second game, copy this
// folder, point js/active-game.js at it, and leave the engine untouched.
import { OBSTACLES } from "./obstacles/index.js";
import {
  PALETTE,
  drawStar,
  drawDebrisPiece,
  drawFallbackRunner,
  drawFallbackScenery,
} from "./art.js";

export const GAME = {
  id: "bogota",

  // Prefix for every localStorage key the engine writes (best score, player
  // name, mute). Two games on the same origin must not share it — and this
  // one stays "ragnar" because that is what players' saved best scores are
  // already filed under; renaming it would silently reset them.
  storagePrefix: "ragnar",

  // Where the world sits on the canvas. GROUND_Y is the line the runner's
  // feet and every obstacle's base are pinned to; the scenery is scaled so
  // its own curb lands exactly here (see backgrounds[].roadSrcY).
  layout: {
    groundY: 390,
    playerScreenX: 170,
    playerDrawHeight: 150,
  },

  // Feel. Arrived at by playtesting live through the ?admin panel, not
  // guessed — these are the values that made the game playable again. The
  // engine seeds TUNE from them (js/tuning.js) so the panel can move them at
  // runtime.
  physics: {
    GRAVITY: 1.0,
    JUMP_VELOCITY: -15,
    START_SPEED: 8.6, // baseSpeed at the moment a run starts
    BASE_SPEED_CAP: 9.0, // top of the difficulty ramp
    // baseSpeed climbs from START_SPEED to BASE_SPEED_CAP at this rate per dt
    // unit (~60 units/real-second).
    RAMP_RATE: 0.018,
    // A jump's horizontal reach is curSpeed * jumpTotalFrames() — below this
    // speed that reach drops under the widest obstacle's width, so a
    // correctly-timed jump can still land on top of it. Never let curSpeed
    // sit below this (game start, "slow down" input, post-hit stumble).
    MIN_SAFE_SPEED: 4.7,
    JUMP_SPEED_MULT: 1.1, // while airborne, world scroll is curSpeed * this
    MAX_LIVES: 5,
    STARS_PER_LIFE: 10,
  },
  startingLives: 3,

  // One spritesheet: a uniform grid where every cell is exactly frameW x
  // frameH. Switching animation is switching row + frame-count range; the
  // pixel offset is always derived, never hand-authored.
  sheet: {
    src: "sprites/spritesheet.png",
    frameW: 182,
    frameH: 193,
    anims: {
      run: { row: 0, frameCount: 24 },
      jump: { row: 1, frameCount: 23 },
    },
  },

  // Collectibles. Radius doubles as the difficulty knob: bigger ones sit low
  // with a wide catch window, smaller ones sit near the jump apex.
  starTiers: [
    { weight: 0.15, offsetMin: 90, offsetMax: 100, r: 12 }, // easy: low, forgiving
    { weight: 0.25, offsetMin: 85, offsetMax: 115, r: 14 }, // medium
    { weight: 0.2, offsetMin: 95, offsetMax: 112, r: 10 }, // hard: near max jump height
  ],

  // Scenery, in the order a run reveals it. minScore is the score from which
  // a photo takes over (the list must stay sorted ascending); roadSrcY is the
  // source-image row where the curb meets the road, scaled to land on
  // layout.groundY so the ground stays under the runner's feet however
  // differently the photos are framed.
  backgrounds: [
    { src: "sprites/background-bogota.webp", minScore: 0, roadSrcY: 782 },
    { src: "sprites/background.webp", minScore: 4000, roadSrcY: 795 },
    // Sunset over the eastern hills — the reward for a long run.
    { src: "sprites/background-sunset.webp", minScore: 5000, roadSrcY: 641 },
  ],

  // Every word the game shows. Fetched at startup by js/strings.js — the
  // path is relative to the page, not to this module.
  strings: "js/games/bogota/strings.json",

  obstacles: OBSTACLES,

  art: {
    palette: PALETTE,
    star: drawStar,
    debrisPiece: drawDebrisPiece,
    fallbackRunner: drawFallbackRunner,
    fallbackScenery: drawFallbackScenery,
  },

  audio: {
    music: "audio/funky-sidewalk-loop",
    hit: "audio/hit",
    // The track is a purpose-built loop: 120.00 BPM, exactly 16 bars. Stated
    // rather than taken from buffer.duration, because decoding adds codec
    // padding (Vorbis decodes to 32.016 s here) and looping on that plays
    // 16ms of encoder tail before wrapping.
    musicLoopSeconds: 32,
    musicVolume: 0.45,
    hitVolume: 0.7,
  },

  // Public anon key — safe client-side; the table's own CHECK constraints
  // (score range, name length) are what bound the data, not key secrecy.
  leaderboard: {
    url: "https://czwpovbmwstjlgemzxsp.supabase.co",
    anonKey: "sb_publishable_iewfgpWVKtjY57SFKrD9hQ_GYRb2AKo",
    table: "scores",
  },

  // Shown on the start screen, one picked at random per load. All three are
  // 1024x1536 so they sit identically under `background-size: auto` — the CSS
  // scrolls the image at its native size, which means pixel dimensions ARE
  // the zoom level and a differently-sized file would change the framing.
  heroImages: [
    "images/ragnar aiming.webp",
    "images/ragnar macdonalds.webp",
    "images/ragnar-tmlenio.webp",
  ],

};
