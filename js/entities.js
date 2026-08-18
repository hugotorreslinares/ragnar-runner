// Spawning, catching, and colliding with obstacles/stars/debris — the game
// rules that mutate G. Ending the game on 0 lives is decided by the caller
// (game.js's update loop), not here, so this module never needs to import
// game.js back.
import { W } from './dom.js';
import { GROUND_Y, STAR_TIERS } from './config.js';
import { TUNE } from './tuning.js';
import { G, updateLivesUI, updateStarsUI } from './state.js';

// ---------- Obstacle generation ----------
export function spawnObstacle(){
  const roll = Math.random();
  let type, w, h;
  if (roll < 0.55) { type = 'crate'; w = 42 + Math.random()*14; h = w; }
  else { type = 'barrel'; w = 34; h = 54 + Math.random()*14; }
  // gap shrinks slowly as difficulty ramps, but never below a fair minimum
  const gap = 420 + Math.random()*380 - Math.min(G.elapsed*0.02, 220);
  const gapClamped = Math.max(gap, 300);
  const worldX = Math.max(G.lastObstacleX + gapClamped, G.scrollX + W + 200);
  G.obstacles.push({ worldX, type, w, h });
  G.lastObstacleX = worldX;
}

// Stars float at jump height and can only be caught mid-air (see the
// collision block in game.js's update()). Gap and height/tier are
// randomized so timing the jump matters.
export function spawnStar(){
  const gap = 500 + Math.random()*600;
  const worldX = Math.max(G.lastStarX + gap, G.scrollX + W + 300);
  let roll = Math.random(), tier = STAR_TIERS[STAR_TIERS.length - 1];
  for (const t of STAR_TIERS){ if (roll < t.weight){ tier = t; break; } roll -= t.weight; }
  const groundOffset = tier.offsetMin + Math.random()*(tier.offsetMax - tier.offsetMin);
  G.stars.push({ worldX, groundOffset, r: tier.r, caught: false });
  G.lastStarX = worldX;
}

// The bob/rotate phase used for a star's idle animation, shared by render.js
// (drawStar) and game.js (collision) so the hitbox always matches what's
// actually drawn — using the static groundOffset for collision while
// render.js bobs the sprite ±5px around it made the star's visible position
// drift up to 5px away from where it actually got caught.
export function starBobPhase(s){
  return G.elapsed*0.08 + s.worldX;
}

export function collectStar(s){
  s.caught = true;
  G.starsCollected++;
  G.starPopups.push({ worldX: s.worldX, y: GROUND_Y - s.groundOffset, t: 0.8 });
  if (G.starsCollected >= TUNE.STARS_PER_LIFE){
    if (G.lives < TUNE.MAX_LIVES){
      G.starsCollected = 0;
      G.lives++;
      updateLivesUI();
      G.starPop = 1.2; // only claim "+1 LIFE" when a life was actually granted
    } else {
      // already at the cap — bank the progress instead of resetting it to 0
      // for nothing, so it isn't wasted while capped and resumes normally
      // the moment a life is lost.
      G.starsCollected = TUNE.STARS_PER_LIFE;
    }
  }
  updateStarsUI();
}

// Sends a hit obstacle flying — screen-space physics, independent of world
// scroll, so it reads clearly as "that thing got launched" instead of just
// vanishing. Kicked backward/up, away from the player's facing direction.
export function launchDebris(o, ox){
  const away = -G.player.facing || 1;
  G.debris.push({
    type: o.type, w: o.w, h: o.h,
    x: ox, y: GROUND_Y - o.h/2,
    vx: away * (3 + Math.random()*2.5),
    vy: -(9 + Math.random()*4),
    rot: 0,
    rotV: away * (0.25 + Math.random()*0.2),
    t: 0,
  });
}

export function hitPlayer(){
  G.lives -= 1;
  G.player.invuln = 1.6;
  G.shakeT = 0.5;
  G.hitFlash = 1;
  // Stumble: a hard speed cut for feedback, but never below MIN_SAFE_SPEED —
  // dropping all the way to 0 left too little horizontal jump reach to clear
  // the *next* obstacle even with perfect timing, right when the player is
  // recovering from the last hit.
  G.curSpeed = Math.max(TUNE.MIN_SAFE_SPEED, G.curSpeed * 0.35);
  updateLivesUI();
}
