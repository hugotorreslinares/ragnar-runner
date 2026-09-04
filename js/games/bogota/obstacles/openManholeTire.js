import { ctx } from "../../../dom.js";
import { GROUND_Y } from "../../../config.js";
import { groundShadow } from "../../../obstacles/utils.js";

export function drawOpenManholeTire(x, w, h) {
  const top = GROUND_Y - h;

  ctx.save();
  ctx.translate(x, 0);

  // ==================================================
  // PROPORCIONES
  // ==================================================

  const visualW = Math.max(w, h * 1.15);
  const visualH = h;

  const halfW = visualW / 2;

  // Centro del obstáculo
  const centerY = GROUND_Y - visualH * 0.42;

  // ==================================================
  // SOMBRA
  // ==================================================

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';

  ctx.beginPath();
  ctx.ellipse(
    0,
    GROUND_Y + 2,
    halfW * 0.85,
    visualH * 0.13,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // ==================================================
  // BORDE ROTO DEL PAVIMENTO
  // ==================================================

  // Primero una zona oscura irregular alrededor
  // del hueco para representar el pavimento roto.

  const holeW = visualW * 0.72;
  const holeH = visualH * 0.28;

  ctx.fillStyle = '#242627';

  ctx.beginPath();

  ctx.moveTo(-holeW * 0.50, centerY);
  ctx.lineTo(-holeW * 0.43, centerY - holeH * 0.45);
  ctx.lineTo(-holeW * 0.18, centerY - holeH * 0.57);
  ctx.lineTo(holeW * 0.18, centerY - holeH * 0.53);
  ctx.lineTo(holeW * 0.47, centerY - holeH * 0.35);
  ctx.lineTo(holeW * 0.52, centerY);
  ctx.lineTo(holeW * 0.38, centerY + holeH * 0.45);
  ctx.lineTo(0, centerY + holeH * 0.55);
  ctx.lineTo(-holeW * 0.40, centerY + holeH * 0.40);

  ctx.closePath();
  ctx.fill();

  // ==================================================
  // INTERIOR DE LA ALCANTARILLA
  // ==================================================

  const innerW = holeW * 0.78;
  const innerH = holeH * 0.70;

  const holeGrad = ctx.createRadialGradient(
    0,
    centerY,
    1,
    0,
    centerY,
    innerW * 0.55
  );

  holeGrad.addColorStop(0, '#050607');
  holeGrad.addColorStop(0.65, '#101314');
  holeGrad.addColorStop(1, '#292c2c');

  ctx.fillStyle = holeGrad;

  ctx.beginPath();

  ctx.ellipse(
    0,
    centerY,
    innerW / 2,
    innerH / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // ==================================================
  // BORDE METÁLICO DE LA ALCANTARILLA
  // ==================================================

  ctx.strokeStyle = '#555250';
  ctx.lineWidth = Math.max(2, visualW * 0.045);

  ctx.beginPath();

  ctx.ellipse(
    0,
    centerY,
    holeW * 0.48,
    holeH * 0.48,
    0,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  // borde oxidado interior
  ctx.strokeStyle = '#332b26';
  ctx.lineWidth = Math.max(1, visualW * 0.025);

  ctx.beginPath();

  ctx.ellipse(
    0,
    centerY,
    holeW * 0.39,
    holeH * 0.38,
    0,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  // ==================================================
  // LLANTA
  // ==================================================

  // La llanta está ligeramente inclinada.
  ctx.save();

  ctx.translate(
    -visualW * 0.02,
    centerY - visualH * 0.015
  );

  ctx.rotate(-0.13);

  const tireW = visualW * 0.48;
  const tireH = visualH * 0.30;

  // --------------------------------------------------
  // Sombra de la llanta
  // --------------------------------------------------

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';

  ctx.beginPath();

  ctx.ellipse(
    0,
    visualH * 0.035,
    tireW * 0.54,
    tireH * 0.48,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // --------------------------------------------------
  // Caucho exterior
  // --------------------------------------------------

  const tireGrad = ctx.createLinearGradient(
    -tireW / 2,
    0,
    tireW / 2,
    0
  );

  tireGrad.addColorStop(0, '#111314');
  tireGrad.addColorStop(0.25, '#242728');
  tireGrad.addColorStop(0.50, '#303334');
  tireGrad.addColorStop(0.75, '#1c1f20');
  tireGrad.addColorStop(1, '#0b0d0e');

  ctx.fillStyle = tireGrad;

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    tireW / 2,
    tireH / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // --------------------------------------------------
  // Agujero central
  // --------------------------------------------------

  ctx.fillStyle = '#080a0b';

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    tireW * 0.25,
    tireH * 0.27,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // --------------------------------------------------
  // Interior de la llanta
  // --------------------------------------------------

  ctx.strokeStyle = '#464747';
  ctx.lineWidth = Math.max(2, visualW * 0.025);

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    tireW * 0.28,
    tireH * 0.30,
    0,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  // ==================================================
  // DIBUJO DE LA BANDA DE RODAMIENTO
  // ==================================================

  ctx.strokeStyle = 'rgba(5, 6, 7, 0.75)';
  ctx.lineWidth = Math.max(1, visualW * 0.018);

  for (let i = -3; i <= 3; i++) {
    const tx = i * tireW * 0.11;

    ctx.beginPath();

    ctx.moveTo(
      tx - tireW * 0.035,
      -tireH * 0.43
    );

    ctx.lineTo(
      tx + tireW * 0.035,
      -tireH * 0.20
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
      tx - tireW * 0.035,
      tireH * 0.20
    );

    ctx.lineTo(
      tx + tireW * 0.035,
      tireH * 0.43
    );

    ctx.stroke();
  }

  // ==================================================
  // DESGASTE / REFLEJOS
  // ==================================================

  ctx.strokeStyle = 'rgba(110, 112, 110, 0.28)';
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    tireW * 0.43,
    Math.PI * 1.15,
    Math.PI * 1.75
  );

  ctx.stroke();

  ctx.restore();

  // ==================================================
  // PEQUEÑOS PEDAZOS DE PAVIMENTO
  // ==================================================

  ctx.fillStyle = '#383a3a';

  const debris = [
    [-visualW * 0.43, centerY - visualH * 0.16, 3],
    [visualW * 0.43, centerY - visualH * 0.05, 2],
    [visualW * 0.34, centerY + visualH * 0.15, 2],
    [-visualW * 0.35, centerY + visualH * 0.13, 2]
  ];

  debris.forEach(([dx, dy, size]) => {
    ctx.fillRect(dx, dy, size, size);
  });

  ctx.restore();
}