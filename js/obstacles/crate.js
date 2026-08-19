// Red road-barrier crate: tapered body, reflective stripes, stubby feet.
import { ctx } from "../dom.js";
import { GROUND_Y } from "../config.js";
import { groundShadow } from "./utils.js";

export function drawCrate(x, w, h) {
  const top = GROUND_Y - h;

  ctx.save();
  ctx.translate(x, 0);

  const topY = top;
  const bottomY = GROUND_Y;

  // El cuerpo se estrecha hacia arriba
  const topHalf = w * 0.39;
  const bottomHalf = w * 0.5;

  groundShadow(GROUND_Y, w * 0.48, 5, 0.22);

  // --------------------------------------------------
  // Cuerpo principal
  // --------------------------------------------------
  const body = new Path2D();

  body.moveTo(-topHalf, topY);
  body.lineTo(topHalf, topY);

  // Parte derecha inclinada
  body.lineTo(bottomHalf, bottomY - h * 0.12);

  // Base derecha
  body.lineTo(bottomHalf * 0.92, bottomY);

  // Parte inferior
  body.lineTo(-bottomHalf * 0.92, bottomY);

  // Base izquierda
  body.lineTo(-bottomHalf, bottomY - h * 0.12);

  body.closePath();

  // Sombra/base
  ctx.fillStyle = "#a92d20";
  ctx.fill(body);

  // --------------------------------------------------
  // Cara frontal roja
  // --------------------------------------------------
  const front = new Path2D();

  front.moveTo(-topHalf * 0.94, topY + h * 0.03);
  front.lineTo(topHalf * 0.94, topY + h * 0.03);

  front.lineTo(bottomHalf * 0.91, bottomY - h * 0.15);
  front.lineTo(-bottomHalf * 0.91, bottomY - h * 0.15);

  front.closePath();

  ctx.fillStyle = "#c83a29";
  ctx.fill(front);

  // --------------------------------------------------
  // Parte superior
  // --------------------------------------------------
  ctx.fillStyle = "#d04431";

  ctx.beginPath();
  ctx.moveTo(-topHalf, topY);
  ctx.lineTo(topHalf, topY);
  ctx.lineTo(topHalf * 0.94, topY + h * 0.055);
  ctx.lineTo(-topHalf * 0.94, topY + h * 0.055);
  ctx.closePath();
  ctx.fill();

  // --------------------------------------------------
  // Nervaduras verticales
  // --------------------------------------------------
  const ribPositions = [-0.3, -0.1, 0.1, 0.3];

  ribPositions.forEach((position) => {
    const ribX = w * position;

    const rib = new Path2D();

    rib.moveTo(ribX - w * 0.018, topY + h * 0.12);
    rib.lineTo(ribX + w * 0.018, topY + h * 0.12);

    rib.lineTo(ribX + w * 0.026, bottomY - h * 0.18);

    rib.lineTo(ribX - w * 0.026, bottomY - h * 0.18);

    rib.closePath();

    ctx.fillStyle = "#a92d20";
    ctx.fill(rib);

    // Highlight de la nervadura
    ctx.strokeStyle = "rgba(255, 100, 70, 0.28)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(ribX - w * 0.012, topY + h * 0.13);
    ctx.lineTo(ribX - w * 0.012, bottomY - h * 0.19);
    ctx.stroke();
  });

  // --------------------------------------------------
  // Franjas reflectivas superiores
  // --------------------------------------------------
  ctx.fillStyle = "#e6e6d8";

  // Franja izquierda
  ctx.save();
  ctx.translate(-w * 0.23, topY + h * 0.1);
  ctx.rotate(-0.02);

  ctx.beginPath();
  ctx.roundRect(-w * 0.15, -h * 0.025, w * 0.3, h * 0.05, 2);
  ctx.fill();

  ctx.restore();

  // Franja derecha
  ctx.save();
  ctx.translate(w * 0.23, topY + h * 0.1);
  ctx.rotate(0.02);

  ctx.beginPath();
  ctx.roundRect(-w * 0.15, -h * 0.025, w * 0.3, h * 0.05, 2);
  ctx.fill();

  ctx.restore();

  // --------------------------------------------------
  // Franjas reflectivas verticales
  // --------------------------------------------------
  const reflectPositions = [-0.31, -0.1, 0.1, 0.31];

  reflectPositions.forEach((position) => {
    const rx = w * position;

    ctx.strokeStyle = "#e9e9df";
    ctx.lineWidth = Math.max(3, w * 0.018);
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(rx, topY + h * 0.18);

    ctx.lineTo(rx, topY + h * 0.68);

    ctx.lineTo(rx + (position > 0 ? w * 0.015 : -w * 0.015), bottomY - h * 0.22);

    ctx.stroke();
  });

  // --------------------------------------------------
  // Bordes laterales para dar profundidad
  // --------------------------------------------------
  ctx.strokeStyle = "rgba(75, 20, 15, 0.55)";
  ctx.lineWidth = Math.max(1.5, w * 0.012);

  ctx.beginPath();

  ctx.moveTo(-topHalf, topY);
  ctx.lineTo(-bottomHalf, bottomY - h * 0.12);
  ctx.lineTo(-bottomHalf * 0.92, bottomY);

  ctx.moveTo(topHalf, topY);
  ctx.lineTo(bottomHalf, bottomY - h * 0.12);
  ctx.lineTo(bottomHalf * 0.92, bottomY);

  ctx.stroke();

  // --------------------------------------------------
  // Patas / salientes inferiores
  // --------------------------------------------------
  const feet = [-0.32, 0, 0.32];

  feet.forEach((position) => {
    const fx = w * position;
    const footW = w * 0.17;
    const footH = h * 0.075;

    ctx.fillStyle = "#9d291e";

    ctx.beginPath();
    ctx.roundRect(fx - footW / 2, bottomY - footH * 0.55, footW, footH, 3);
    ctx.fill();
  });

  // --------------------------------------------------
  // Contorno inferior
  // --------------------------------------------------
  ctx.strokeStyle = "rgba(70, 18, 12, 0.6)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(-bottomHalf * 0.92, bottomY);

  ctx.lineTo(bottomHalf * 0.92, bottomY);

  ctx.stroke();

  ctx.restore();
}
