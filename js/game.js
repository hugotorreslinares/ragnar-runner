// The simulation tick (update), the render/request-animation-frame loop, and
// flow control (start/end/pause). This is the one module that ties
// input + entities + render + state together each frame.
import { W, H, scoreVal, startOverlay, overOverlay, pauseOverlay, overText, lbOverList } from './dom.js';
import { GROUND_Y, SHEET, FRAME_ASPECT } from './config.js';
import { TUNE, jumpTotalFrames } from './tuning.js';
import { G, PHASE, phase, setPhase, resetGame, updateSpeedUI, BEST, setBest } from './state.js';
import { keys, hasQueuedJump, clearQueuedJump, clearInput } from './input.js';
import { spawnObstacle, spawnStar, collectStar, launchDebris, hitPlayer, starBobPhase } from './entities.js';
import { draw } from './render.js';
import { loadLeaderboardInto, resetSubmitUI } from './leaderboard.js';
import { startMusic, stopMusic, pauseMusic, resumeMusic, playHit } from './audio.js';

function update(dt){
  if (phase !== PHASE.PLAYING) return;
  G.elapsed += dt;

  // speed control
  const targetBoost = keys.right ? 2.6 : 0;
  const targetSlow = keys.left ? 2.4 : 0;
  // Ramp from the fixed starting speed, not from the current baseSpeed —
  // reassigning baseSpeed += elapsed*k onto itself every frame compounds
  // into quadratic growth (measured: 3.2 -> 10.0 in ~106 frames / 1.8s
  // instead of the intended ~94s), which is why a run that never touches
  // the keys used to hit max speed almost immediately.
  G.baseSpeed = Math.min(TUNE.START_SPEED + G.elapsed*TUNE.RAMP_RATE, TUNE.BASE_SPEED_CAP);
  const desired = Math.max(TUNE.MIN_SAFE_SPEED, G.baseSpeed + targetBoost - targetSlow);
  G.curSpeed += (desired - G.curSpeed) * Math.min(1, 0.12*dt);

  // Airborne moves a little slower than running (JUMP_SPEED_MULT < 1) —
  // a deliberate small penalty for feel, not a hard stop like the old
  // "stumble" mechanic.
  const moveSpeed = G.player.onGround ? G.curSpeed : G.curSpeed * TUNE.JUMP_SPEED_MULT;
  const scrollDelta = moveSpeed * dt; // how far the world moved this frame, for sweep collision below
  G.scrollX += scrollDelta;
  G.score = Math.floor(G.scrollX / 8);
  scoreVal.textContent = G.score;
  updateSpeedUI();

  // facing
  if (keys.left && !keys.right) G.player.facing = -1;
  else if (keys.right && !keys.left) G.player.facing = 1;

  // jump
  if (hasQueuedJump() && G.player.onGround){
    clearQueuedJump();
    G.player.vy = TUNE.JUMP_VELOCITY;
    G.player.onGround = false;
    G.player.jumpElapsed = 0;
  }

  // physics
  G.player.vy += TUNE.GRAVITY * dt;
  G.player.y += G.player.vy * dt;
  if (G.player.y >= 0){ G.player.y = 0; G.player.vy = 0; G.player.onGround = true; }
  if (!G.player.onGround) G.player.jumpElapsed += dt;

  // animation: pick (animation, frameIndex) — switching animation is just
  // switching which row/range we read from, per SHEET.anims.
  if (G.player.onGround){
    const cycleSpeed = Math.max(0.35, G.curSpeed / 4.2);
    G.player.animPhase += dt * cycleSpeed * 0.85;
    G.player.curAnim = 'run';
    G.player.curFrame = Math.floor(G.player.animPhase) % SHEET.anims.run.frameCount;
  } else {
    const progress = Math.min(1, G.player.jumpElapsed / jumpTotalFrames());
    G.player.curAnim = 'jump';
    G.player.curFrame = Math.min(
      SHEET.anims.jump.frameCount - 1,
      Math.floor(progress * (SHEET.anims.jump.frameCount - 1))
    );
  }

  // dt is in ~60fps-frame units (dt≈1 per frame, ≈60 per real second), so
  // any timer meant to represent real seconds must decrement by dt/60 —
  // decrementing by raw dt drains a "1.6 second" timer in about 2 frames.
  if (G.shakeT > 0) G.shakeT -= dt/60;
  if (G.hitFlash > 0) G.hitFlash = Math.max(0, G.hitFlash - dt*0.08);

  for (const d of G.debris){
    d.vy += TUNE.GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.rot += d.rotV * dt;
    d.t += dt/60;
  }
  G.debris = G.debris.filter(d => d.t < 1 && d.y < H + 100);

  // spawn obstacles ahead
  while (G.lastObstacleX - G.scrollX < W + 400){
    spawnObstacle();
  }
  // drop obstacles behind
  G.obstacles = G.obstacles.filter(o => (o.worldX - G.scrollX) > -120);

  // spawn/drop stars ahead/behind, same scheme as obstacles
  while (G.lastStarX - G.scrollX < W + 600){
    spawnStar();
  }
  G.stars = G.stars.filter(s => !s.caught && (s.worldX - G.scrollX) > -80);

  if (G.player.invuln > 0) G.player.invuln -= dt/60;
  if (G.starPop > 0) G.starPop -= dt/60;
  G.starPopups.forEach(p => { p.t -= dt*0.02; p.y -= dt*0.6; });
  G.starPopups = G.starPopups.filter(p => p.t > 0);

  // collision
  const pDrawH = 150;
  const pDrawW = pDrawH / FRAME_ASPECT;
  const pFeetY = GROUND_Y + G.player.y;
  const pTopY = pFeetY - pDrawH;
  const boxW = pDrawW * 0.42, boxH = pDrawH * 0.72;
  const pLeft = G.player.screenX - boxW/2;
  const pRight = G.player.screenX + boxW/2;
  const pTop = pFeetY - boxH;
  const pBot = pFeetY - 4;

  for (const o of G.obstacles){
    const ox = o.worldX - G.scrollX;
    const oLeft = ox - o.w/2, oRight = ox + o.w/2;
    const oTop = GROUND_Y - o.h, oBot = GROUND_Y;
    const overlap = pLeft < oRight && pRight > oLeft && pTop < oBot && pBot > oTop;
    if (overlap && G.player.invuln <= 0 && !o.hit){
      o.hit = true; // each obstacle can only cost one life, even if the player
      launchDebris(o, ox);  // lingers on top of it while speed is ramping back up
      hitPlayer();          // send it flying — makes the hit unmistakable
      playHit();
      if (G.lives <= 0) endGame();
    }
  }
  G.obstacles = G.obstacles.filter(o => !o.hit);

  // star collection: catch when the star's drawn position overlaps the
  // player's real body — the same hurtbox the obstacle loop above uses, so
  // "looks like it touched" and "counts as caught" ask the same question.
  //
  // This used to be gated on !onGround and compared the star's height
  // against a single foot-height point (-G.player.y, which is exactly 0
  // while standing). Since the sprite is 150px tall and stars hover 85-115px
  // up, a star could visibly overlap the character's torso while the check
  // either never ran (on the ground) or compared it against the feet.
  for (const s of G.stars){
    if (s.caught) continue;
    const sx = s.worldX - G.scrollX;
    // swept on x against the body's real width, so a fast scroll can't
    // step the star clean past the player between two frames
    const sweepLeft = sx - s.r, sweepRight = sx + scrollDelta + s.r;
    const xHit = sweepLeft < pRight && sweepRight > pLeft;
    // star's actual drawn screen y, bob included — matches drawStar exactly,
    // so the hitbox never drifts from what's on screen
    const starScreenY = GROUND_Y - s.groundOffset + Math.sin(starBobPhase(s)) * 5;
    const yHit = starScreenY + s.r > pTop && starScreenY - s.r < pBot;
    if (xHit && yHit){
      collectStar(s);
    }
  }
}

// ---------- Loop ----------
let lastT = null;
export function loop(t){
  if (lastT === null) lastT = t;
  let dt = (t - lastT) / (1000/60);
  // Clamp both ends: an unusually long stall shouldn't cause a physics
  // blowup (upper bound), and a backward/non-monotonic timestamp shouldn't
  // produce a negative dt that corrupts accumulators like elapsed/scrollX
  // (lower bound) — negative dt has no physical meaning for a fixed-step sim.
  dt = Math.max(0, Math.min(dt, 2.5));
  lastT = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- Flow control ----------
export function startGame(){
  resetGame();
  setPhase(PHASE.PLAYING);
  startMusic();
  startOverlay.classList.add('hidden');
  overOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
}

export function endGame(){
  setPhase(PHASE.OVER);
  stopMusic();
  // update() is a no-op once phase leaves PLAYING, so any transient effect
  // still mid-flight (screen shake, the hit-flash red tint + "-1" text,
  // invulnerability flicker) would otherwise freeze at whatever value it
  // had on the frame the game ended, and draw() keeps rendering it forever.
  G.debris = [];
  G.starPopups = [];
  G.shakeT = 0;
  G.hitFlash = 0;
  G.player.invuln = 0;
  if (G.score > BEST){
    setBest(G.score);
    overText.textContent = 'New best! ' + G.score + ' meters away from  the center of Bogotá.';
  } else {
    overText.textContent = 'You made ' + G.score + ' Bogotá got you. Too many obstacles Too many potholes And definitely too many bollards.';
  }
  overOverlay.classList.remove('hidden');
  resetSubmitUI();
  loadLeaderboardInto(lbOverList, 20);
}

export function togglePause(){
  if (phase === PHASE.PLAYING){
    setPhase(PHASE.PAUSED);
    clearInput();
    pauseMusic();
    pauseOverlay.classList.remove('hidden');
  } else if (phase === PHASE.PAUSED){
    setPhase(PHASE.PLAYING);
    resumeMusic();
    pauseOverlay.classList.add('hidden');
  }
}
