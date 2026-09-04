// Armored cash-in-transit van — a Bogotá street fixture. Drawn in side
// profile with the cab facing left (toward the oncoming player): low cab up
// front, tall armored cargo box behind it, slit windows, reflective stripe.
import { ctx } from "../../../dom.js";
import { GROUND_Y } from "../../../config.js";
import { groundShadow, roundRect } from "../../../obstacles/utils.js";

export function drawArmoredVan(x, w, h) {
  const top = GROUND_Y - h;
  const halfW = w / 2;

  ctx.save();
  ctx.translate(x, 0);

  groundShadow(GROUND_Y, w * 0.46, 4, 0.32);

  // ==================================================
  // PROPORCIONES
  // ==================================================

  // El chasis descansa sobre las ruedas, no sobre el suelo.
  const wheelRadius = Math.max(3, h * 0.15);
  const chassisBottom = GROUND_Y - wheelRadius * 0.9;

  // La cabina (izquierda) es más baja que el furgón blindado (derecha).
  const cabTop = top + h * 0.3;
  const boxTop = top;
  const cabRight = -halfW * 0.16; // donde termina la cabina y empieza el furgón

  // ==================================================
  // RUEDAS
  // ==================================================

  const wheelPositions = [-halfW * 0.62, halfW * 0.52];

  for (const wheelX of wheelPositions) {
    const wheelY = GROUND_Y - wheelRadius;

    // neumático
    ctx.fillStyle = "#141718";
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    // rin
    ctx.fillStyle = "#6e7476";
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelRadius * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3b4142";
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==================================================
  // FURGÓN BLINDADO (cuerpo trasero, alto)
  // ==================================================

  const boxGrad = ctx.createLinearGradient(0, boxTop, 0, chassisBottom);
  boxGrad.addColorStop(0, "#b9bcbb");
  boxGrad.addColorStop(0.4, "#94999a");
  boxGrad.addColorStop(1, "#5f6567");

  ctx.fillStyle = boxGrad;
  roundRect(
    cabRight,
    boxTop,
    halfW - cabRight + halfW * 0.02,
    chassisBottom - boxTop,
    Math.max(2, w * 0.02),
  );
  ctx.fill();

  // remaches del blindaje
  ctx.fillStyle = "rgba(60, 66, 68, 0.55)";
  const rivetR = Math.max(0.8, w * 0.008);
  const rivetTop = boxTop + h * 0.09;
  const rivetBottom = chassisBottom - h * 0.09;

  for (let i = 0; i <= 3; i++) {
    const rx = cabRight + ((halfW - cabRight) * i) / 3;
    for (const ry of [rivetTop, rivetBottom]) {
      ctx.beginPath();
      ctx.arc(rx, ry, rivetR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==================================================
  // VENTANILLA BLINDADA DEL FURGÓN (tronera)
  // ==================================================

  const slitW = (halfW - cabRight) * 0.34;
  const slitH = h * 0.1;
  const slitX = cabRight + (halfW - cabRight) * 0.18;
  const slitY = boxTop + h * 0.16;

  ctx.fillStyle = "#1d2830";
  ctx.fillRect(slitX, slitY, slitW, slitH);

  ctx.strokeStyle = "#4a5052";
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.strokeRect(slitX, slitY, slitW, slitH);

  // barrotes
  ctx.strokeStyle = "rgba(30, 34, 36, 0.9)";
  ctx.lineWidth = Math.max(1, w * 0.008);
  for (let i = 1; i < 3; i++) {
    const bx = slitX + (slitW * i) / 3;
    ctx.beginPath();
    ctx.moveTo(bx, slitY);
    ctx.lineTo(bx, slitY + slitH);
    ctx.stroke();
  }

  // ==================================================
  // FRANJA REFLECTIVA + LOGO
  // ==================================================

  const stripeY = boxTop + h * 0.42;
  const stripeH = h * 0.16;

  ctx.fillStyle = "#1f4f8f";
  ctx.fillRect(cabRight, stripeY, halfW - cabRight + halfW * 0.02, stripeH);

  ctx.fillStyle = "#e8c33a";
  ctx.fillRect(
    cabRight,
    stripeY + stripeH * 0.72,
    halfW - cabRight + halfW * 0.02,
    stripeH * 0.28,
  );

  // escudo del logo
  const badgeX = cabRight + (halfW - cabRight) * 0.62;
  const badgeY = stripeY + stripeH * 0.34;
  const badgeR = Math.min(w * 0.05, h * 0.075);

  ctx.fillStyle = "#eeeeea";
  ctx.beginPath();
  ctx.moveTo(badgeX, badgeY - badgeR);
  ctx.lineTo(badgeX + badgeR * 0.8, badgeY - badgeR * 0.45);
  ctx.lineTo(badgeX + badgeR * 0.8, badgeY + badgeR * 0.3);
  ctx.quadraticCurveTo(
    badgeX,
    badgeY + badgeR * 1.1,
    badgeX - badgeR * 0.8,
    badgeY + badgeR * 0.3,
  );
  ctx.lineTo(badgeX - badgeR * 0.8, badgeY - badgeR * 0.45);
  ctx.closePath();
  ctx.fill();

  // ==================================================
  // CABINA (frente, más baja)
  // ==================================================

  const cabLeft = -halfW;

  const cab = new Path2D();
  cab.moveTo(cabLeft + w * 0.03, chassisBottom);
  cab.lineTo(cabLeft, cabTop + h * 0.13);
  cab.lineTo(cabLeft + w * 0.05, cabTop);
  cab.lineTo(cabRight, cabTop);
  cab.lineTo(cabRight, chassisBottom);
  cab.closePath();

  const cabGrad = ctx.createLinearGradient(0, cabTop, 0, chassisBottom);
  cabGrad.addColorStop(0, "#aeb2b1");
  cabGrad.addColorStop(0.45, "#8b9091");
  cabGrad.addColorStop(1, "#585e60");

  ctx.fillStyle = cabGrad;
  ctx.fill(cab);

  // parabrisas / ventana lateral de la cabina
  const winX = cabLeft + w * 0.045;
  const winY = cabTop + h * 0.05;
  const winW = (cabRight - cabLeft) * 0.46;
  const winH = h * 0.16;

  ctx.fillStyle = "#20323d";
  ctx.beginPath();
  ctx.moveTo(winX, winY + winH);
  ctx.lineTo(winX + w * 0.012, winY);
  ctx.lineTo(winX + winW, winY);
  ctx.lineTo(winX + winW, winY + winH);
  ctx.closePath();
  ctx.fill();

  // reflejo del vidrio
  ctx.fillStyle = "rgba(190, 214, 226, 0.28)";
  ctx.beginPath();
  ctx.moveTo(winX + w * 0.015, winY + winH);
  ctx.lineTo(winX + winW * 0.42, winY);
  ctx.lineTo(winX + winW * 0.66, winY);
  ctx.lineTo(winX + winW * 0.2, winY + winH);
  ctx.closePath();
  ctx.fill();

  // ==================================================
  // DEFENSA Y FAROL
  // ==================================================

  // bumper
  ctx.fillStyle = "#3d4344";
  ctx.fillRect(cabLeft - w * 0.01, chassisBottom - h * 0.09, w * 0.09, h * 0.07);

  // farol
  ctx.fillStyle = "#f2e6b8";
  roundRect(
    cabLeft + w * 0.005,
    cabTop + h * 0.3,
    w * 0.045,
    h * 0.07,
    Math.max(1, w * 0.008),
  );
  ctx.fill();

  // ==================================================
  // CONTORNOS
  // ==================================================

  ctx.strokeStyle = "rgba(20, 24, 26, 0.75)";
  ctx.lineWidth = Math.max(1.5, w * 0.012);

  ctx.stroke(cab);

  roundRect(
    cabRight,
    boxTop,
    halfW - cabRight + halfW * 0.02,
    chassisBottom - boxTop,
    Math.max(2, w * 0.02),
  );
  ctx.stroke();

  ctx.restore();
}
