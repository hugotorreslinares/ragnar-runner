// Game phase (menu/playing/paused/over) and G, the single mutable bag of
// per-run data. Other modules import G and mutate its properties directly
// (G.foo = ...) — they just can't reassign the G binding itself, which is
// fine since we never need to.
import { livesWrap, livesMiniWrap, starsVal, starsMini, speedVal, speedMini, scoreVal, bestVal } from './dom.js';
import { TUNE } from './tuning.js';
import { GAME } from './active-game.js';
import { PLAYER_SCREEN_X } from './config.js';
import { keys } from './input.js';

export const PHASE = { READY: 'ready', PLAYING: 'playing', OVER: 'over', PAUSED: 'paused' };
export let phase = PHASE.READY;
export function setPhase(p){ phase = p; }

// Build the heart icons from TUNE.MAX_LIVES instead of hardcoding a count in
// the HTML — keeps the HUD in sync if MAX_LIVES ever changes (including live
// via the admin panel, which calls this again through rebuildLivesUI()).
export function rebuildLivesUI(){
  [livesWrap, livesMiniWrap].forEach(wrap => {
    wrap.innerHTML = '<div class="life"></div>'.repeat(TUNE.MAX_LIVES);
  });
  updateLivesUI();
}

export let BEST = 0;
const BEST_KEY = GAME.storagePrefix + 'Best';
try { BEST = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (e) { BEST = 0; }
bestVal.textContent = BEST;

export function setBest(v){
  BEST = v;
  try { localStorage.setItem(BEST_KEY, String(BEST)); } catch (e) {}
  bestVal.textContent = BEST;
}

export const G = {
  player: {
    screenX: PLAYER_SCREEN_X,
    y: 0,           // 0 = on ground, negative = height above ground
    vy: 0,
    facing: 1,      // 1 = right, -1 = left
    onGround: true,
    animPhase: 0,   // continuous run-cycle phase (frame units)
    jumpElapsed: 0, // time airborne, for mapping the jump animation to flight progress
    curAnim: 'run',
    curFrame: 0,
    invuln: 0,
  },
  scrollX: 0,
  baseSpeed: 0, // real starting value is set by resetGame()
  curSpeed: 0,
  elapsed: 0,
  lives: GAME.startingLives,
  score: 0,
  shakeT: 0,
  hitFlash: 0, // 1 = just hit an obstacle, fades to 0
  obstacles: [],
  lastObstacleX: 900, // world x of the most recently spawned obstacle
  milestones: {},     // scheduled obstacle type -> last milestone already spawned (see dueMilestoneType)
  debris: [],         // obstacles knocked flying on hit — screen-space physics, decoupled from world scroll
  stars: [],
  lastStarX: 1300,    // world x of the most recently spawned star
  starsCollected: 0,
  starPop: 0,         // brief "life gained" flash timer
  starPopups: [],      // {worldX, y, t} per-star "+1" popups, mirrors hitFlash's "-1"
};

rebuildLivesUI(); // must run after G exists — updateLivesUI() (called inside) reads G.lives

export function resetGame(){
  G.scrollX = 0;
  G.baseSpeed = TUNE.START_SPEED;
  // Start at running speed, not 0 easing up to it — the first few seconds
  // of a run otherwise have too little horizontal jump reach to clear an
  // obstacle even with perfect timing (reach = curSpeed * jump duration).
  G.curSpeed = TUNE.START_SPEED;
  G.elapsed = 0;
  G.lives = GAME.startingLives;
  G.score = 0;
  const p = G.player;
  p.y = 0; p.vy = 0; p.onGround = true; p.invuln = 0; p.facing = 1;
  p.animPhase = 0; p.jumpElapsed = 0; p.curAnim = 'run'; p.curFrame = 0;
  G.obstacles = [];
  G.lastObstacleX = 900;
  G.milestones = {};
  G.debris = [];
  G.stars = [];
  G.lastStarX = 1300;
  G.starsCollected = 0;
  G.starPop = 0;
  G.starPopups = [];
  G.hitFlash = 0;
  updateLivesUI();
  updateStarsUI();
  updateSpeedUI();
  scoreVal.textContent = '0';
}

export function updateSpeedUI(){
  const txt = G.curSpeed.toFixed(1);
  const maxed = G.baseSpeed >= TUNE.BASE_SPEED_CAP - 0.05 && !keys.right;
  speedVal.textContent = txt;
  speedVal.style.color = maxed ? 'var(--danger)' : '';
  speedMini.textContent = '⚡ ' + txt;
  speedMini.classList.toggle('maxed', maxed);
}

export function updateStarsUI(){
  const txt = G.starsCollected + '/' + TUNE.STARS_PER_LIFE;
  starsVal.textContent = txt;
  starsMini.textContent = '★ ' + txt;
}

export function updateLivesUI(){
  [livesWrap, livesMiniWrap].forEach(wrap => {
    wrap.querySelectorAll('.life').forEach((el, i) => el.classList.toggle('lost', i >= G.lives));
  });
}
