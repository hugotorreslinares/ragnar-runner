// "Kong Run" — a second game on the same engine, and the proof that the
// engine/game split holds: nothing under js/ outside this folder changes to
// run it.
//
// It is a SKELETON. Every visual is drawn in code and it ships no image or
// audio file, so it is playable today and each asset can be swapped in one at
// a time: drop a spritesheet in `sheet` and the runner in art.js stops being
// used; add entries to `backgrounds` and the painted canopy stops being
// called; point `audio` at real files and the music starts.
//
// To play it, change js/active-game.js to import from this folder.
import { OBSTACLES } from "./obstacles/index.js";
import {
  PALETTE,
  drawStar,
  drawDebrisPiece,
  drawFallbackRunner,
  drawFallbackScenery,
} from "./art.js";

export const GAME = {
  id: "jungle",

  // Must differ from every other game's: the prefix namespaces the saved best
  // score, player name and mute preference, and two games sharing an origin
  // would otherwise overwrite each other.
  storagePrefix: "kong",

  layout: {
    groundY: 390,
    playerScreenX: 170,
    playerDrawHeight: 150,
  },

  // Copied from Bogotá deliberately. These came out of playtesting and jump
  // measurements, and the obstacle sizes below were chosen against them, so
  // changing one without re-measuring the other is how a game becomes
  // unfair. Tune them live with ?admin once there is real art to judge.
  physics: {
    GRAVITY: 1.0,
    JUMP_VELOCITY: -15,
    START_SPEED: 8.6,
    BASE_SPEED_CAP: 9.0,
    RAMP_RATE: 0.018,
    MIN_SAFE_SPEED: 4.7,
    JUMP_SPEED_MULT: 1.1,
    MAX_LIVES: 5,
    STARS_PER_LIFE: 10,
  },
  startingLives: 3,

  // No spritesheet yet. The path is intentionally one that does not exist:
  // the engine's own timeout gives up on it and switches to the painted
  // runner in art.js, which is what this pack wants until there is real art.
  sheet: {
    src: "sprites/jungle-runner.png",
    frameW: 182,
    frameH: 193,
    anims: {
      run: { row: 0, frameCount: 24 },
      jump: { row: 1, frameCount: 23 },
    },
  },

  starTiers: [
    { weight: 0.2, offsetMin: 90, offsetMax: 100, r: 12 },
    { weight: 0.5, offsetMin: 85, offsetMax: 115, r: 14 },
    { weight: 0.3, offsetMin: 95, offsetMax: 112, r: 10 },
  ],

  // Empty on purpose, which the renderer supports: with no photo to show it
  // paints art.js's canopy instead. Adding scenery is adding entries here —
  // {src, minScore, roadSrcY} — and nothing else.
  backgrounds: [],

  obstacles: OBSTACLES,

  strings: "js/games/jungle/strings.json",

  art: {
    palette: PALETTE,
    star: drawStar,
    debrisPiece: drawDebrisPiece,
    fallbackRunner: drawFallbackRunner,
    fallbackScenery: drawFallbackScenery,
  },

  // Silent for now. The paths do not resolve, and js/audio.js treats a failed
  // decode as "no sound" rather than an error, so the game runs mute.
  audio: {
    music: "audio/jungle-loop",
    hit: "audio/hit",
    musicLoopSeconds: 32,
    musicVolume: 0.45,
    hitVolume: 0.7,
  },

  // Its own table, so scores never mix with Bogotá's. Until one exists the
  // leaderboard shows its "couldn't reach" message and the rest of the game
  // is unaffected.
  leaderboard: {
    url: "https://czwpovbmwstjlgemzxsp.supabase.co",
    anonKey: "sb_publishable_iewfgpWVKtjY57SFKrD9hQ_GYRb2AKo",
    table: "jungle_scores",
  },

  heroImages: [],
};
