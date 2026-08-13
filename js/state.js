// Game phase (menu/playing/paused/over) and G, the single mutable bag of
// per-run data. Other modules import G and mutate its properties directly
// (G.foo = ...) — they just can't reassign the G binding itself, which is
// fine since we never need to.
import { livesWrap, livesMiniWrap, starsVal, starsMini, speedVal, speedMini, scoreVal, bestVal } from './dom.js';
import { MAX_LIVES, STARS_PER_LIFE, BASE_SPEED_CAP, START_SPEED } from './config.js';
import { keys } from './input.js';

export const PHASE = { READY: 'ready', PLAYING: 'playing', OVER: 'over', PAUSED: 'paused' };
export let phase = PHASE.READY;
export function setPhase(p){ phase = p; }

// Build the heart icons from MAX_LIVES instead of hardcoding a count in the
// HTML — keeps the HUD in sync if MAX_LIVES ever changes again.
[livesWrap, livesMiniWrap].forEach(wrap => {
  wrap.innerHTML = '<div class="life"></div>'.repeat(MAX_LIVES);
});

export let BEST = 0;
try { BEST = parseInt(localStorage.getItem('ragnarBest') || '0', 10) || 0; } catch (e) { BEST = 0; }
bestVal.textContent = BEST;

export function setBest(v){
  BEST = v;
  try { localStorage.setItem('ragnarBest', String(BEST)); } catch (e) {}
  bestVal.textContent = BEST;
}

export const G = {
  player: {
    screenX: 170,
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
  lives: 3,
  score: 0,
  shakeT: 0,
  hitFlash: 0, // 1 = just hit an obstacle, fades to 0
  obstacles: [],
  lastObstacleX: 900, // world x of the most recently spawned obstacle
  debris: [],         // obstacles knocked flying on hit — screen-space physics, decoupled from world scroll
  stars: [],
  lastStarX: 1300,    // world x of the most recently spawned star
  starsCollected: 0,
  starPop: 0,         // brief "life gained" flash timer
  starPopups: [],      // {worldX, y, t} per-star "+1" popups, mirrors hitFlash's "-1"
};

export function resetGame(){
  G.scrollX = 0;
  G.baseSpeed = START_SPEED;
  G.curSpeed = 0;
  G.elapsed = 0;
  G.lives = 3;
  G.score = 0;
  const p = G.player;
  p.y = 0; p.vy = 0; p.onGround = true; p.invuln = 0; p.facing = 1;
  p.animPhase = 0; p.jumpElapsed = 0; p.curAnim = 'run'; p.curFrame = 0;
  G.obstacles = [];
  G.lastObstacleX = 900;
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
  const maxed = G.baseSpeed >= BASE_SPEED_CAP - 0.05 && !keys.right;
  speedVal.textContent = txt;
  speedVal.style.color = maxed ? 'var(--danger)' : '';
  speedMini.textContent = '⚡ ' + txt;
  speedMini.classList.toggle('maxed', maxed);
}

export function updateStarsUI(){
  const txt = G.starsCollected + '/' + STARS_PER_LIFE;
  starsVal.textContent = txt;
  starsMini.textContent = '★ ' + txt;
}

export function updateLivesUI(){
  [livesWrap, livesMiniWrap].forEach(wrap => {
    wrap.querySelectorAll('.life').forEach((el, i) => el.classList.toggle('lost', i >= G.lives));
  });
}
