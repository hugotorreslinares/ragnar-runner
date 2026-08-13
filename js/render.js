// Everything that touches the canvas 2D context. Pure drawing — no game
// logic or state mutation happens here, only reads of G/assets.
import { ctx, W, H } from './dom.js';
import { GROUND_Y, FRAME_ASPECT, BG_SWITCH_SCORE, BG_ROAD_SRC_Y, BG_ROAD_SRC_Y_2 } from './config.js';
import { G } from './state.js';
import {
  sheetImg, allLoaded, useFallbackArt, sheetRect,
  bgImg, bgLoaded, bgFailed, bgImg2, bg2Loaded, bg2Failed,
} from './assets.js';
import { starBobPhase } from './entities.js';

function drawBackground(){
  const useBogota = G.score >= BG_SWITCH_SCORE;
  const img = useBogota ? bgImg2 : bgImg;
  const loaded = useBogota ? bg2Loaded : bgLoaded;
  const failed = useBogota ? bg2Failed : bgFailed;
  const roadSrcY = useBogota ? BG_ROAD_SRC_Y_2 : BG_ROAD_SRC_Y;

  if (loaded){
    const scale = GROUND_Y / roadSrcY;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dy = GROUND_Y - roadSrcY * scale;
    const parallax = 0.55; // background drifts slower than the foreground for depth
    const totalScroll = G.scrollX * parallax;
    let idx = Math.floor(totalScroll / dw) - 1;
    const limit = totalScroll + W + dw;
    while (idx * dw - totalScroll < limit){
      const dx = idx * dw - totalScroll;
      ctx.save();
      if (idx % 2 !== 0){
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
    const haze = ctx.createLinearGradient(0, GROUND_Y-60, 0, GROUND_Y);
    haze.addColorStop(0, 'rgba(20,26,28,0)');
    haze.addColorStop(1, 'rgba(20,26,28,0.25)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, GROUND_Y-60, W, 60);
  } else {
    // fallback while loading, or if the photo fails for any reason
    const skyGrad = ctx.createLinearGradient(0,0,0,GROUND_Y);
    skyGrad.addColorStop(0, '#61787f');
    skyGrad.addColorStop(1, '#33454b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,GROUND_Y);
    if (failed){
      ctx.fillStyle = 'rgba(20,28,31,0.55)';
      const farOffset = -(G.scrollX*0.15) % 260;
      for (let x = farOffset - 260; x < W+260; x += 260){
        ctx.fillRect(x+20, 140, 90, GROUND_Y-140);
        ctx.fillRect(x+130, 170, 70, GROUND_Y-170);
        ctx.fillRect(x+210, 120, 50, GROUND_Y-120);
      }
    }
  }

  // ground
  const groundGrad = ctx.createLinearGradient(0,GROUND_Y,0,H);
  groundGrad.addColorStop(0, '#2c3438');
  groundGrad.addColorStop(1, '#181e20');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, W, H-GROUND_Y);
  ctx.strokeStyle = 'rgba(232,171,58,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y+1.5); ctx.lineTo(W, GROUND_Y+1.5); ctx.stroke();

  // ground tick marks (scroll-synced, gives motion feedback)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  const tickSpacing = 46;
  const off = G.scrollX % tickSpacing;
  for (let x = -off; x < W; x += tickSpacing){
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y+14);
    ctx.lineTo(x-14, GROUND_Y+30);
    ctx.stroke();
  }
}

function drawCrate(x, w, h){
  const top = GROUND_Y - h;
  ctx.save();
  ctx.translate(x, 0);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(-w/2, top, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-w/2, top, w, 6);
  // hazard stripe band
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w/2, top + h*0.38, w, h*0.24);
  ctx.clip();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-w/2, top + h*0.38, w, h*0.24);
  ctx.fillStyle = '#e8ab3a';
  for (let sx=-w; sx<w; sx+=14){
    ctx.beginPath();
    ctx.moveTo(sx,-999); ctx.lineTo(sx+7,-999); ctx.lineTo(sx+7+999,999); ctx.lineTo(sx+999,999);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // plank lines
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  for (let i=1;i<3;i++){
    ctx.beginPath();
    ctx.moveTo(-w/2 + (w/3)*i, top);
    ctx.lineTo(-w/2 + (w/3)*i, top+h);
    ctx.stroke();
  }
  ctx.strokeStyle = '#2b1c10';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w/2, top, w, h);
  ctx.restore();
}

function drawBarrel(x, w, h){
  const top = GROUND_Y - h;
  ctx.save();
  ctx.translate(x, 0);
  const grad = ctx.createLinearGradient(-w/2,0,w/2,0);
  grad.addColorStop(0, '#2a2f33');
  grad.addColorStop(0.5, '#4d565b');
  grad.addColorStop(1, '#22262a');
  ctx.fillStyle = grad;
  roundRect(-w/2, top, w, h, w*0.28);
  ctx.fill();
  ctx.fillStyle = '#e8ab3a';
  ctx.fillRect(-w/2, top + h*0.22, w, h*0.09);
  ctx.fillRect(-w/2, top + h*0.62, w, h*0.09);
  ctx.strokeStyle = '#0e1113';
  ctx.lineWidth = 2;
  roundRect(-w/2, top, w, h, w*0.28);
  ctx.stroke();
  ctx.restore();
}

function drawStar(x, y, r, bob){
  const yy = y + Math.sin(bob) * 5;
  ctx.save();
  ctx.translate(x, yy);
  ctx.rotate(Math.sin(bob*0.6) * 0.15);
  ctx.beginPath();
  for (let i=0;i<5;i++){
    const outerA = -Math.PI/2 + i*(Math.PI*2/5);
    const innerA = outerA + Math.PI/5;
    ctx.lineTo(Math.cos(outerA)*r, Math.sin(outerA)*r);
    ctx.lineTo(Math.cos(innerA)*r*0.42, Math.sin(innerA)*r*0.42);
  }
  ctx.closePath();
  ctx.fillStyle = '#e8ab3a';
  ctx.shadowColor = 'rgba(232,171,58,0.7)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#8a6a26';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Same crate/barrel look as drawCrate/drawBarrel, but centered on (0,0) so
// the caller can translate+rotate it freely — used for flying debris.
function drawDebrisPiece(d){
  const w = d.w, h = d.h, top = -h/2;
  if (d.type === 'crate'){
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(-w/2, top, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-w/2, top, w, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    for (let i=1;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(-w/2 + (w/3)*i, top);
      ctx.lineTo(-w/2 + (w/3)*i, top+h);
      ctx.stroke();
    }
    ctx.strokeStyle = '#2b1c10';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w/2, top, w, h);
  } else {
    const grad = ctx.createLinearGradient(-w/2,0,w/2,0);
    grad.addColorStop(0, '#2a2f33');
    grad.addColorStop(0.5, '#4d565b');
    grad.addColorStop(1, '#22262a');
    ctx.fillStyle = grad;
    roundRect(-w/2, top, w, h, w*0.28);
    ctx.fill();
    ctx.fillStyle = '#e8ab3a';
    ctx.fillRect(-w/2, top + h*0.22, w, h*0.09);
    ctx.fillRect(-w/2, top + h*0.62, w, h*0.09);
    ctx.strokeStyle = '#0e1113';
    ctx.lineWidth = 2;
    roundRect(-w/2, top, w, h, w*0.28);
    ctx.stroke();
  }
}

function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawFallbackRunner(feetY, topY, drawH, drawW, phase, facing){
  // A simple, readable vector runner used only if the sprite art fails to load.
  ctx.save();
  ctx.translate(0, 0);
  const cx = 0;
  const legSwing = Math.sin(phase) * drawW*0.28;
  const armSwing = Math.sin(phase+Math.PI) * drawW*0.22;
  const bodyTop = topY + drawH*0.28;
  const bodyBot = topY + drawH*0.72;
  const hipY = bodyBot;
  const headR = drawH*0.13;

  ctx.strokeStyle = '#e9e4d6';
  ctx.fillStyle = '#c9a876';
  ctx.lineWidth = Math.max(3, drawW*0.09);
  ctx.lineCap = 'round';

  // back leg
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - legSwing, feetY);
  ctx.strokeStyle = '#2c2440';
  ctx.stroke();
  // front leg
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + legSwing, feetY);
  ctx.strokeStyle = '#3a2f56';
  ctx.stroke();

  // torso
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + drawW*0.05, bodyTop);
  ctx.strokeStyle = '#c9a876';
  ctx.stroke();

  // back arm
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop+drawH*0.06);
  ctx.lineTo(cx - armSwing, bodyTop+drawH*0.22);
  ctx.strokeStyle = '#b3906a';
  ctx.stroke();
  // front arm
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop+drawH*0.06);
  ctx.lineTo(cx + armSwing, bodyTop+drawH*0.22);
  ctx.strokeStyle = '#c9a876';
  ctx.stroke();

  // head
  ctx.beginPath();
  ctx.fillStyle = '#c9a876';
  ctx.arc(cx + drawW*0.05, bodyTop - headR*0.6, headR, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#8a6a26';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawPlayer(){
  const pDrawH = 150;
  const pDrawW = pDrawH / FRAME_ASPECT;
  const feetY = GROUND_Y + G.player.y;
  const topY = feetY - pDrawH;

  ctx.save();
  if (G.player.invuln > 0 && Math.floor(G.player.invuln*16)%2===0){
    ctx.globalAlpha = 0.35;
  }
  ctx.translate(G.player.screenX, 0);
  if (G.player.facing < 0) ctx.scale(-1,1);

  if (!allLoaded){
    ctx.restore();
    return; // nothing to draw yet, still within the initial load grace period
  }

  if (useFallbackArt){
    const phase = G.player.onGround ? G.player.animPhase*2 : Math.PI/2;
    drawFallbackRunner(feetY, topY, pDrawH, pDrawW, phase, G.player.facing);
  } else if (sheetImg.complete && sheetImg.naturalWidth > 0){
    // Derive the source rectangle purely from (animation, frameIndex) —
    // this is the whole "spritesheet" trick: one image, computed offsets.
    const { sx, sy, sw, sh } = sheetRect(G.player.curAnim, G.player.curFrame);
    ctx.drawImage(sheetImg, sx, sy, sw, sh, -pDrawW/2, topY, pDrawW, pDrawH);
  } else {
    drawFallbackRunner(feetY, topY, pDrawH, pDrawW, G.player.animPhase*2, G.player.facing);
  }
  ctx.restore();

  // soft contact shadow
  ctx.save();
  const squash = G.player.onGround ? 1 : Math.max(0.35, 1 - Math.abs(G.player.y)/220);
  ctx.translate(G.player.screenX, GROUND_Y+2);
  ctx.scale(squash,1);
  const shGrad = ctx.createRadialGradient(0,0,2,0,0,42);
  shGrad.addColorStop(0,'rgba(0,0,0,0.42)');
  shGrad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath(); ctx.ellipse(0,0,42,10,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

export function draw(){
  ctx.save();
  if (G.shakeT > 0){
    const m = G.shakeT*55;
    ctx.translate((Math.random()-0.5)*m, (Math.random()-0.5)*m*0.5);
  }
  drawBackground();

  for (const o of G.obstacles){
    const ox = o.worldX - G.scrollX;
    if (ox < -100 || ox > W+100) continue;
    if (o.type === 'crate') drawCrate(ox, o.w, o.h);
    else drawBarrel(ox, o.w, o.h);
  }

  for (const d of G.debris){
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = Math.max(0, 1 - d.t/0.9);
    drawDebrisPiece(d);
    ctx.restore();
  }

  for (const s of G.stars){
    if (s.caught) continue;
    const sx = s.worldX - G.scrollX;
    if (sx < -60 || sx > W+60) continue;
    drawStar(sx, GROUND_Y - s.groundOffset, s.r, starBobPhase(s));
  }

  drawPlayer();

  for (const p of G.starPopups){
    const px = p.worldX - G.scrollX;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.t);
    ctx.fillStyle = '#e8ab3a';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+1', px, p.y);
    ctx.restore();
  }

  if (G.starPop > 0){
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.starPop);
    ctx.fillStyle = '#e8ab3a';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+1 LIFE', W/2, 60);
    ctx.restore();
  }

  if (G.hitFlash > 0){
    // full-screen red pulse + a "-1" popup, so a hit is unmistakable even
    // if the player didn't clearly see the obstacle clip them.
    ctx.save();
    ctx.fillStyle = 'rgba(196,69,58,' + (G.hitFlash*0.45) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, G.hitFlash*1.5);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-1', G.player.screenX, GROUND_Y + G.player.y - 170);
    ctx.restore();
  }

  if (!allLoaded){
    ctx.fillStyle = '#e9e4d6';
    ctx.font = '14px monospace';
    ctx.fillText('loading sprites…', 20, 30);
  }
  ctx.restore();
}
