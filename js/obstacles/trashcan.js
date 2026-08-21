// Perforated metal recycling bin on a frame, with lid and side supports.
import { ctx } from "../dom.js";
import { GROUND_Y } from "../config.js";
import { groundShadow } from "./utils.js";

export function drawTrashcan(x, w, h) {
  const top = GROUND_Y - h;

  ctx.save();
  ctx.translate(x, 0);

  // ==================================================
  // PROPORCIONES
  // ==================================================

  // La caneca es relativamente estrecha y alta.
  const visualW = Math.max(w, h * 0.62);
  const visualH = h;

  const halfW = visualW / 2;

  // La caneca ocupa aproximadamente el 65% de la altura.
  const bodyTop = top + visualH * 0.2;
  const bodyBottom = top + visualH * 0.72;

  const bodyH = bodyBottom - bodyTop;

  groundShadow(GROUND_Y, halfW * 0.75, 4, 0.3);

  // ==================================================
  // PATAS TRASERAS
  // ==================================================

  const legW = Math.max(3, visualW * 0.055);
  const legH = visualH * 0.3;

  ctx.fillStyle = "#555b5d";

  // pierna izquierda
  ctx.fillRect(-visualW * 0.38, bodyBottom - visualH * 0.01, legW, legH);

  // pierna derecha
  ctx.fillRect(visualW * 0.33, bodyBottom - visualH * 0.01, legW, legH);

  // ==================================================
  // BARRA HORIZONTAL INFERIOR
  // ==================================================

  ctx.fillStyle = "#686e70";

  ctx.beginPath();
  ctx.roundRect(
    -visualW * 0.4,
    bodyBottom + visualH * 0.08,
    visualW * 0.8,
    legW * 1.2,
    legW,
  );
  ctx.fill();

  // highlight de la barra
  ctx.strokeStyle = "rgba(220, 220, 215, 0.35)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(-visualW * 0.37, bodyBottom + visualH * 0.08);
  ctx.lineTo(visualW * 0.37, bodyBottom + visualH * 0.08);
  ctx.stroke();

  // ==================================================
  // CUERPO CILÍNDRICO
  // ==================================================

  const metalGrad = ctx.createLinearGradient(-halfW, 0, halfW, 0);

  metalGrad.addColorStop(0, "#596062");
  metalGrad.addColorStop(0.12, "#9da2a2");
  metalGrad.addColorStop(0.28, "#d0d1cc");
  metalGrad.addColorStop(0.5, "#858b8c");
  metalGrad.addColorStop(0.7, "#c5c7c3");
  metalGrad.addColorStop(0.88, "#727879");
  metalGrad.addColorStop(1, "#444a4c");

  ctx.fillStyle = metalGrad;

  ctx.beginPath();

  ctx.moveTo(-halfW * 0.82, bodyTop);

  ctx.quadraticCurveTo(
    -halfW,
    bodyTop + bodyH * 0.08,
    -halfW,
    bodyTop + bodyH * 0.5,
  );

  ctx.quadraticCurveTo(
    -halfW,
    bodyBottom - bodyH * 0.05,
    -halfW * 0.82,
    bodyBottom,
  );

  ctx.lineTo(halfW * 0.82, bodyBottom);

  ctx.quadraticCurveTo(
    halfW,
    bodyBottom - bodyH * 0.05,
    halfW,
    bodyTop + bodyH * 0.5,
  );

  ctx.quadraticCurveTo(halfW, bodyTop + bodyH * 0.08, halfW * 0.82, bodyTop);

  ctx.closePath();

  ctx.fill();

  // ==================================================
  // BORDES LATERALES OSCUROS
  // ==================================================

  ctx.strokeStyle = "rgba(35, 39, 40, 0.65)";
  ctx.lineWidth = Math.max(1.5, visualW * 0.018);

  ctx.beginPath();

  ctx.moveTo(-halfW * 0.82, bodyTop);

  ctx.quadraticCurveTo(
    -halfW,
    bodyTop + bodyH * 0.2,
    -halfW,
    bodyTop + bodyH * 0.5,
  );

  ctx.quadraticCurveTo(
    -halfW,
    bodyBottom - bodyH * 0.05,
    -halfW * 0.82,
    bodyBottom,
  );

  ctx.moveTo(halfW * 0.82, bodyTop);

  ctx.quadraticCurveTo(
    halfW,
    bodyTop + bodyH * 0.2,
    halfW,
    bodyTop + bodyH * 0.5,
  );

  ctx.quadraticCurveTo(
    halfW,
    bodyBottom - bodyH * 0.05,
    halfW * 0.82,
    bodyBottom,
  );

  ctx.stroke();

  // ==================================================
  // PERFORACIONES
  // ==================================================

  // Fewer and bigger than they look like they should be on paper. The can is
  // drawn about 46px wide, so the old 5x7 grid worked out to 0.7px dots 4px
  // apart — sub-pixel, at 55% opacity, i.e. invisible at the size anyone
  // actually sees. Three rows of five at ~2px read as perforations instead.
  //
  // All of them are one Path2D filled once. Filling 35 circles through 35
  // separate beginPath/fill calls was what made this the most expensive
  // obstacle to draw by a factor of ten (~230us against 3-30us for its peers).
  const holeRadius = Math.max(1.6, visualW * 0.045);
  const rows = 3;
  const cols = 5;
  const stepX = visualW * 0.14;
  const stepY = bodyH * 0.085;

  const holes = new Path2D();
  for (let row = 0; row < rows; row++) {
    const py = bodyTop + bodyH * 0.42 + row * stepY;
    for (let col = 0; col < cols; col++) {
      const offset = row % 2 === 0 ? 0 : stepX / 2;
      const px = -stepX * (cols - 1) / 2 + col * stepX + offset;
      if (Math.abs(px) > halfW * 0.72) continue;
      holes.moveTo(px + holeRadius, py);
      holes.arc(px, py, holeRadius, 0, Math.PI * 2);
    }
  }

  ctx.fillStyle = "rgba(22, 25, 26, 0.85)";
  ctx.fill(holes);

  // A hairline of light along the bottom of each hole sells them as punched
  // through the metal rather than painted on.
  ctx.strokeStyle = "rgba(226, 232, 232, 0.22)";
  ctx.lineWidth = 1;
  ctx.stroke(holes);

  // ==================================================
  // BANDA NEGRA
  // ==================================================

  const bandTop = bodyTop + bodyH * 0.22;
  const bandH = bodyH * 0.16;

  ctx.fillStyle = "#1b1d1e";

  ctx.fillRect(-halfW * 0.94, bandTop, visualW * 0.94, bandH);

  // ==================================================
  // BANDA BLANCA / REFLECTIVA
  // ==================================================

  ctx.fillStyle = "#e4e3da";

  ctx.fillRect(
    -halfW * 0.91,
    bandTop + bandH * 0.48,
    visualW * 0.88,
    bandH * 0.42,
  );

  // ==================================================
  // TEXTO
  // ==================================================

  // A esta escala no conviene escribir "RECICLABLES"
  // completo porque se vuelve ilegible.
  // Simulamos una etiqueta.

  ctx.fillStyle = "#202223";
  ctx.font = `bold ${Math.max(4, visualW * 0.075)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText("RECICLABLES", 0, bandTop + bandH * 0.69);

  // ==================================================
  // BORDE SUPERIOR DEL CUERPO
  // ==================================================

  ctx.strokeStyle = "#303536";
  ctx.lineWidth = Math.max(1.5, visualW * 0.025);

  ctx.beginPath();
  ctx.ellipse(0, bodyTop, halfW * 0.84, visualH * 0.035, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ==================================================
  // TAPA SUPERIOR
  // ==================================================

  const lidY = top + visualH * 0.12;

  // sombra de la tapa
  ctx.fillStyle = "#34393a";

  ctx.beginPath();
  ctx.ellipse(0, lidY + 2, halfW * 0.92, visualH * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();

  // tapa metálica
  const lidGrad = ctx.createLinearGradient(
    0,
    lidY - visualH * 0.04,
    0,
    lidY + visualH * 0.05,
  );

  lidGrad.addColorStop(0, "#d7d8d3");
  lidGrad.addColorStop(0.45, "#9b9f9f");
  lidGrad.addColorStop(1, "#555b5d");

  ctx.fillStyle = lidGrad;

  ctx.beginPath();
  ctx.ellipse(0, lidY, halfW * 0.88, visualH * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // ==================================================
  // SOPORTES VERTICALES
  // ==================================================

  ctx.fillStyle = "#555b5c";

  const supportW = Math.max(2, visualW * 0.045);

  // izquierdo
  ctx.fillRect(
    -halfW * 0.88,
    top + visualH * 0.08,
    supportW,
    bodyBottom - top - visualH * 0.05,
  );

  // derecho
  ctx.fillRect(
    halfW * 0.84,
    top + visualH * 0.08,
    supportW,
    bodyBottom - top - visualH * 0.05,
  );

  // highlights de los tubos
  ctx.fillStyle = "rgba(220,220,215,0.35)";

  ctx.fillRect(
    -halfW * 0.87,
    top + visualH * 0.09,
    Math.max(1, supportW * 0.25),
    bodyBottom - top - visualH * 0.08,
  );

  ctx.fillRect(
    halfW * 0.85,
    top + visualH * 0.09,
    Math.max(1, supportW * 0.25),
    bodyBottom - top - visualH * 0.08,
  );

  // ==================================================
  // CONTORNO DE LAS PATAS
  // ==================================================

  ctx.strokeStyle = "rgba(30,34,35,0.65)";
  ctx.lineWidth = 1;

  ctx.strokeRect(-visualW * 0.38, bodyBottom, legW, legH);

  ctx.strokeRect(visualW * 0.33, bodyBottom, legW, legH);

  ctx.restore();
}
