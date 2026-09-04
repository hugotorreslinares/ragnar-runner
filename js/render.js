// Everything that touches the canvas 2D context. Pure drawing — no game
// logic or state mutation happens here, only reads of G/assets.
import { ctx, W, H } from "./dom.js";
import {
  GROUND_Y,
  FRAME_ASPECT,
  PLAYER_DRAW_HEIGHT,
  backgroundIndexForScore,
} from "./config.js";
import { G } from "./state.js";
import {
  sheetImg,
  allLoaded,
  useFallbackArt,
  sheetRect,
  backgrounds,
  requestBackground,
} from "./assets.js";
import { starBobPhase } from "./entities.js";
import { drawObstacle } from "./obstacles/index.js";
import { GAME } from "./active-game.js";
import { t } from "./strings.js";

// The game supplies the things that are about *this* world — the collectible,
// the debris, the stand-in runner, the road's colours. The renderer decides
// where and when they are drawn; it never decides what they look like.
const { palette: PAL, star: drawStar, debrisPiece: drawDebrisPiece,
        fallbackRunner: drawFallbackRunner } = GAME.art;
import {
  drawSeasonalBackdrop,
  drawSeasonalForeground,
  groundLineColor,
} from "./seasonal.js";

// How far ahead of its own minScore the next background starts downloading.
// At running speed this is roughly ten seconds of lead, enough for a few
// hundred KB to arrive before the swap so the scenery never pops in late.
const BG_PRELOAD_LEAD = 800;

function drawBackground() {
  const idx = backgroundIndexForScore(G.score);
  const entry = backgrounds[idx];
  // Request the one we are about to draw, not just the one after it: a run
  // can arrive at a stage without having passed through its preload window
  // (a restart at a high score, a slow first load), and an unrequested
  // background never loads at all — the sky falls back to a flat gradient.
  requestBackground(entry);
  const next = backgrounds[idx + 1];
  if (next && G.score >= next.def.minScore - BG_PRELOAD_LEAD) requestBackground(next);

  const { img, loaded, failed } = entry;
  const roadSrcY = entry.def.roadSrcY;

  if (loaded) {
    const scale = GROUND_Y / roadSrcY;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dy = GROUND_Y - roadSrcY * scale;
    const parallax = 0.45; // background drifts slower than the foreground for depth
    const totalScroll = G.scrollX * parallax;
    let idx = Math.floor(totalScroll / dw) - 1;
    const limit = totalScroll + W + dw;
    while (idx * dw - totalScroll < limit) {
      const dx = idx * dw - totalScroll;
      ctx.save();
      if (idx % 2 !== 0) {
        // mirror every other tile — the shared edge matches itself exactly,
        // so the repeat has no visible seam even though the art isn't tileable.
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, dw, dh);
      } else {
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      ctx.restore();
      idx++;
    }
    // slight atmospheric haze so the ground band we draw next sits naturally
    const haze = ctx.createLinearGradient(0, GROUND_Y - 60, 0, GROUND_Y);
    haze.addColorStop(0, `rgba(${PAL.haze},0)`);
    haze.addColorStop(1, `rgba(${PAL.haze},0.25)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, GROUND_Y - 60, W, 60);
  } else {
    // fallback while loading, or if the photo fails for any reason
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, PAL.fallbackSkyTop);
    skyGrad.addColorStop(1, PAL.fallbackSkyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GROUND_Y);
    if (failed) {
      ctx.fillStyle = PAL.fallbackBuildings;
      const farOffset = -(G.scrollX * 0.15) % 260;
      for (let x = farOffset - 260; x < W + 260; x += 260) {
        ctx.fillRect(x + 20, 140, 90, GROUND_Y - 140);
        ctx.fillRect(x + 130, 170, 70, GROUND_Y - 170);
        ctx.fillRect(x + 210, 120, 50, GROUND_Y - 120);
      }
    }
  }

  // ground
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  groundGrad.addColorStop(0, PAL.groundTop);
  groundGrad.addColorStop(1, PAL.groundBottom);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = groundLineColor();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1.5);
  ctx.lineTo(W, GROUND_Y + 1.5);
  ctx.stroke();

  // ground tick marks (scroll-synced, gives motion feedback)
  ctx.strokeStyle = PAL.groundTicks;
  ctx.lineWidth = 3;
  const tickSpacing = 46;
  const off = G.scrollX % tickSpacing;
  for (let x = -off; x < W; x += tickSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 14);
    ctx.lineTo(x - 14, GROUND_Y + 30);
    ctx.stroke();
  }
}

function drawPlayer() {
  const pDrawH = PLAYER_DRAW_HEIGHT;
  const pDrawW = pDrawH / FRAME_ASPECT;
  const feetY = GROUND_Y + G.player.y;
  const topY = feetY - pDrawH;

  ctx.save();
  if (G.player.invuln > 0 && Math.floor(G.player.invuln * 16) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }
  ctx.translate(G.player.screenX, 0);
  if (G.player.facing < 0) ctx.scale(-1, 1);

  if (!allLoaded) {
    ctx.restore();
    return; // nothing to draw yet, still within the initial load grace period
  }

  if (useFallbackArt) {
    const phase = G.player.onGround ? G.player.animPhase * 2 : Math.PI / 2;
    drawFallbackRunner(feetY, topY, pDrawH, pDrawW, phase, G.player.facing);
  } else if (sheetImg.complete && sheetImg.naturalWidth > 0) {
    // Derive the source rectangle purely from (animation, frameIndex) —
    // this is the whole "spritesheet" trick: one image, computed offsets.
    const { sx, sy, sw, sh } = sheetRect(G.player.curAnim, G.player.curFrame);
    ctx.drawImage(sheetImg, sx, sy, sw, sh, -pDrawW / 2, topY, pDrawW, pDrawH);
  } else {
    drawFallbackRunner(
      feetY,
      topY,
      pDrawH,
      pDrawW,
      G.player.animPhase * 2,
      G.player.facing,
    );
  }
  ctx.restore();

  // soft contact shadow
  ctx.save();
  const squash = G.player.onGround
    ? 1
    : Math.max(0.35, 1 - Math.abs(G.player.y) / 220);
  ctx.translate(G.player.screenX, GROUND_Y + 2);
  ctx.scale(squash, 1);
  const shGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
  shGrad.addColorStop(0, "rgba(0,0,0,0.42)");
  shGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function draw() {
  ctx.save();
  if (G.shakeT > 0) {
    const m = G.shakeT * 55;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m * 0.5);
  }
  drawBackground();
  // Seasonal wash + sky props: after the scenery so they tint it, before the
  // obstacles so they never tint those.
  drawSeasonalBackdrop();

  for (const o of G.obstacles) {
    const ox = o.worldX - G.scrollX;
    if (ox < -100 || ox > W + 100) continue;
    drawObstacle(o, ox);
  }

  for (const d of G.debris) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = Math.max(0, 1 - d.t / 0.9);
    drawDebrisPiece(d);
    ctx.restore();
  }

  for (const s of G.stars) {
    if (s.caught) continue;
    const sx = s.worldX - G.scrollX;
    if (sx < -60 || sx > W + 60) continue;
    drawStar(sx, GROUND_Y - s.groundOffset, s.r, starBobPhase(s));
  }

  drawPlayer();

  for (const p of G.starPopups) {
    const px = p.worldX - G.scrollX;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.t);
    ctx.fillStyle = PAL.accent;
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(t("canvas.starPopup"), px, p.y);
    ctx.restore();
  }

  if (G.starPop > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.starPop);
    ctx.fillStyle = PAL.accent;
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText(t("canvas.lifeGained"), W / 2, 60);
    ctx.restore();
  }

  drawSeasonalForeground();

  if (G.hitFlash > 0) {
    // full-screen red pulse + a "-1" popup, so a hit is unmistakable even
    // if the player didn't clearly see the obstacle clip them.
    ctx.save();
    ctx.fillStyle = `rgba(${PAL.damage},${G.hitFlash * 0.45})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, G.hitFlash * 1.5);
    ctx.fillStyle = PAL.text;
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText(t("canvas.lifeLost"), G.player.screenX, GROUND_Y + G.player.y - 170);
    ctx.restore();
  }

  if (!allLoaded) {
    ctx.fillStyle = PAL.textDim;
    ctx.font = "14px monospace";
    ctx.fillText(t("canvas.loadingSprites"), 20, 30);
  }
  ctx.restore();
}
