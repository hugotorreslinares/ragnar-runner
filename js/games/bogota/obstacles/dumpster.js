// Large wheeled dumpster: paneled body, reflective side stripes, hinged lid.
import { ctx } from "../../../dom.js";
import { GROUND_Y } from "../../../config.js";
import { groundShadow } from "../../../obstacles/utils.js";

export function drawDumpster(x, w, h) {
  const top = GROUND_Y - h;

  ctx.save();
  ctx.translate(x, 0);

  // ==================================================
  // PROPORCIONES
  // ==================================================

  const halfW = w / 2;

  const bodyTop = top + h * 0.18;
  const bodyBottom = GROUND_Y - h * 0.08;

  groundShadow(GROUND_Y, w * 0.48, 4, 0.3);

  // ==================================================
  // RUEDAS
  // ==================================================

  const wheelRadius = Math.max(2, w * 0.045);

  ctx.fillStyle = "#151819";

  for (const wheelX of [-w * 0.34, w * 0.34]) {
    ctx.beginPath();

    ctx.arc(wheelX, GROUND_Y - h * 0.035, wheelRadius, 0, Math.PI * 2);

    ctx.fill();
  }

  // ==================================================
  // CUERPO PRINCIPAL
  // ==================================================

  const body = new Path2D();

  body.moveTo(-halfW * 0.88, bodyTop);

  body.lineTo(halfW * 0.88, bodyTop);

  body.lineTo(halfW * 0.94, bodyBottom);

  body.lineTo(-halfW * 0.94, bodyBottom);

  body.closePath();

  // Gradiente metálico
  const bodyGrad = ctx.createLinearGradient(-halfW, 0, halfW, 0);

  bodyGrad.addColorStop(0, "#15191a");
  bodyGrad.addColorStop(0.18, "#252a2b");
  bodyGrad.addColorStop(0.5, "#303536");
  bodyGrad.addColorStop(0.82, "#202526");
  bodyGrad.addColorStop(1, "#101415");

  ctx.fillStyle = bodyGrad;
  ctx.fill(body);

  // ==================================================
  // PANELES VERTICALES
  // ==================================================

  ctx.strokeStyle = "rgba(0, 0, 0, 0.38)";
  ctx.lineWidth = Math.max(1, w * 0.012);

  const panelPositions = [-0.25, 0, 0.25];

  panelPositions.forEach((position) => {
    const px = w * position;

    ctx.beginPath();

    ctx.moveTo(px, bodyTop + h * 0.03);

    ctx.lineTo(px, bodyBottom - h * 0.02);

    ctx.stroke();
  });

  // ==================================================
  // RELIEVE CENTRAL DE LOS PANELES
  // ==================================================

  ctx.strokeStyle = "rgba(100, 105, 105, 0.18)";
  ctx.lineWidth = 1;

  for (const position of [-0.125, 0.125]) {
    const px = w * position;

    ctx.beginPath();

    ctx.moveTo(px, bodyTop + h * 0.05);

    ctx.lineTo(px, bodyBottom - h * 0.04);

    ctx.stroke();
  }

  // ==================================================
  // BORDE SUPERIOR DEL CUERPO
  // ==================================================

  ctx.fillStyle = "#111516";

  ctx.fillRect(-halfW * 0.92, bodyTop - h * 0.025, w * 0.92, h * 0.055);

  // ==================================================
  // FRANJAS REFLECTIVAS LATERALES
  // ==================================================

  const stripeW = w * 0.14;
  const stripeH = h * 0.25;
  const stripeY = bodyTop + h * 0.28;

  function drawReflectiveStripe(stripeX) {
    // Base roja
    ctx.fillStyle = "#c9342d";

    ctx.fillRect(stripeX, stripeY, stripeW, stripeH);

    // Franjas blancas diagonales
    ctx.save();

    ctx.beginPath();

    ctx.rect(stripeX, stripeY, stripeW, stripeH);

    ctx.clip();

    ctx.fillStyle = "#eeeeea";

    const stripeSize = stripeH * 0.38;

    for (
      let sy = stripeY - stripeH;
      sy < stripeY + stripeH * 2;
      sy += stripeSize
    ) {
      ctx.beginPath();

      ctx.moveTo(stripeX - stripeW * 0.3, sy);

      ctx.lineTo(stripeX + stripeW, sy + stripeSize * 0.65);

      ctx.lineTo(stripeX + stripeW, sy + stripeSize * 0.95);

      ctx.lineTo(stripeX - stripeW * 0.3, sy + stripeSize * 0.3);

      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // borde
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;

    ctx.strokeRect(stripeX, stripeY, stripeW, stripeH);
  }

  drawReflectiveStripe(-halfW * 0.78);

  drawReflectiveStripe(halfW * 0.64);

  // ==================================================
  // LÍNEA BLANCA CENTRAL
  // ==================================================

  ctx.fillStyle = "#eeeeea";

  ctx.fillRect(
    -Math.max(1, w * 0.018),
    bodyTop + h * 0.34,
    Math.max(2, w * 0.036),
    h * 0.34,
  );

  // ==================================================
  // SÍMBOLO DE PROHIBIDO PARQUEAR
  // ==================================================

  const signX = 0;
  const signY = bodyTop + h * 0.17;

  const signRadius = Math.min(w * 0.14, h * 0.105);

  // círculo blanco
  ctx.fillStyle = "#eeeeea";

  ctx.beginPath();
  ctx.arc(signX, signY, signRadius, 0, Math.PI * 2);
  ctx.fill();

  // borde rojo
  ctx.strokeStyle = "#d3312d";
  ctx.lineWidth = Math.max(2, w * 0.035);

  ctx.beginPath();
  ctx.arc(signX, signY, signRadius * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  // diagonal del símbolo
  ctx.strokeStyle = "#d3312d";
  ctx.lineWidth = Math.max(2, w * 0.035);

  ctx.beginPath();

  ctx.moveTo(signX - signRadius * 0.55, signY - signRadius * 0.55);

  ctx.lineTo(signX + signRadius * 0.55, signY + signRadius * 0.55);

  ctx.stroke();

  // ==================================================
  // TAPA SUPERIOR
  // ==================================================

  const lidTop = top;
  const lidBottom = bodyTop;

  const lid = new Path2D();

  lid.moveTo(-halfW * 0.94, lidBottom);

  lid.lineTo(-halfW * 0.88, lidTop + h * 0.035);

  lid.quadraticCurveTo(0, lidTop - h * 0.035, halfW * 0.88, lidTop + h * 0.035);

  lid.lineTo(halfW * 0.94, lidBottom);

  lid.closePath();

  const lidGrad = ctx.createLinearGradient(0, lidTop, 0, lidBottom);

  lidGrad.addColorStop(0, "#454b4c");
  lidGrad.addColorStop(0.45, "#282d2f");
  lidGrad.addColorStop(1, "#15191a");

  ctx.fillStyle = lidGrad;
  ctx.fill(lid);

  // ==================================================
  // NERVADURAS DE LA TAPA
  // ==================================================

  ctx.strokeStyle = "rgba(100,105,106,0.35)";
  ctx.lineWidth = Math.max(1, w * 0.012);

  for (let i = -2; i <= 2; i++) {
    const px = i * w * 0.18;

    ctx.beginPath();

    ctx.moveTo(px, lidTop + h * 0.025);

    ctx.lineTo(px, lidBottom - h * 0.025);

    ctx.stroke();
  }

  // ==================================================
  // BORDE DE LA TAPA
  // ==================================================

  ctx.strokeStyle = "#0d1011";
  ctx.lineWidth = Math.max(2, w * 0.025);

  ctx.beginPath();

  ctx.moveTo(-halfW * 0.92, lidBottom);

  ctx.lineTo(halfW * 0.92, lidBottom);

  ctx.stroke();

  // ==================================================
  // CONTORNO GENERAL
  // ==================================================

  ctx.strokeStyle = "rgba(5, 7, 8, 0.8)";
  ctx.lineWidth = Math.max(1.5, w * 0.015);

  ctx.stroke(body);

  ctx.restore();
}
