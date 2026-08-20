// Sleeping figure on flattened cardboard under blankets — a low, wide
// obstacle. Being low is what keeps it fair despite being the widest hitbox
// in the game (see the sizing note in OBSTACLE_TYPES).
import { ctx } from "../dom.js";
import { GROUND_Y } from "../config.js";
import { groundShadow } from "./utils.js";

export function drawSleepingPerson(x, w, h) {
  ctx.save();
  ctx.translate(x, 0);

  // ==================================================
  // PROPORCIONES
  // ==================================================

  const halfW = w / 2;
  const groundY = GROUND_Y;
  const blanketY = groundY - h * 0.42;

  groundShadow(groundY, w * 0.48, 4, 0.3);

  // ==================================================
  // CARTÓN / BASE
  // ==================================================

  ctx.fillStyle = "#8b6746";

  ctx.beginPath();
  ctx.moveTo(-halfW * 0.95, groundY - h * 0.06);
  ctx.lineTo(halfW * 0.9, groundY - h * 0.06);
  ctx.lineTo(halfW * 0.82, groundY);
  ctx.lineTo(-halfW * 0.88, groundY);
  ctx.closePath();
  ctx.fill();

  // Líneas del cartón
  ctx.strokeStyle = "rgba(55, 38, 25, 0.35)";
  ctx.lineWidth = 1;

  for (let i = -2; i <= 2; i++) {
    const px = i * w * 0.18;

    ctx.beginPath();
    ctx.moveTo(px, groundY - h * 0.055);
    ctx.lineTo(px + w * 0.04, groundY - 1);
    ctx.stroke();
  }

  // ==================================================
  // COBIJA INFERIOR
  // ==================================================

  const blanket = new Path2D();

  blanket.moveTo(-halfW * 0.82, blanketY + h * 0.08);

  blanket.quadraticCurveTo(
    -halfW * 0.65,
    blanketY - h * 0.02,
    -halfW * 0.4,
    blanketY + h * 0.01,
  );

  blanket.quadraticCurveTo(
    -halfW * 0.05,
    blanketY - h * 0.1,
    halfW * 0.3,
    blanketY,
  );

  blanket.quadraticCurveTo(
    halfW * 0.62,
    blanketY + h * 0.02,
    halfW * 0.84,
    blanketY + h * 0.13,
  );

  blanket.lineTo(halfW * 0.78, groundY - h * 0.05);
  blanket.lineTo(-halfW * 0.78, groundY - h * 0.05);
  blanket.closePath();

  ctx.fillStyle = "#8b4037";
  ctx.fill(blanket);

  // ==================================================
  // PATRÓN DE LA COBIJA
  // ==================================================

  ctx.save();
  ctx.clip(blanket);

  ctx.strokeStyle = "rgba(225, 165, 135, 0.30)";
  ctx.lineWidth = 2;

  for (let px = -w; px < w; px += w * 0.16) {
    ctx.beginPath();
    ctx.moveTo(px, blanketY);
    ctx.lineTo(px + w * 0.25, groundY);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(60, 30, 28, 0.30)";
  ctx.lineWidth = 1;

  for (let px = -w; px < w; px += w * 0.22) {
    ctx.beginPath();
    ctx.moveTo(px, blanketY);
    ctx.lineTo(px - w * 0.2, groundY);
    ctx.stroke();
  }

  ctx.restore();

  // ==================================================
  // PIERNAS
  // ==================================================

  ctx.fillStyle = "#3f5264";

  ctx.beginPath();
  ctx.moveTo(-w * 0.02, blanketY - h * 0.02);
  ctx.quadraticCurveTo(
    w * 0.16,
    blanketY - h * 0.15,
    w * 0.35,
    blanketY - h * 0.11,
  );
  ctx.lineTo(w * 0.4, blanketY + h * 0.01);
  ctx.lineTo(w * 0.18, blanketY + h * 0.08);
  ctx.closePath();
  ctx.fill();

  // ==================================================
  // ZAPATO
  // ==================================================

  // Pulled in from 0.40 to 0.36: at 0.40 the shoe painted ~5px past the
  // right edge of the collision box, so it read as "touching" before the
  // hitbox agreed. Keep the art inside w.
  const shoeX = w * 0.36;
  const shoeR = w * 0.13;

  ctx.fillStyle = "#242629";

  ctx.beginPath();
  ctx.ellipse(shoeX, blanketY - h * 0.1, shoeR, h * 0.075, -0.12, 0, Math.PI * 2);
  ctx.fill();

  // Suela
  ctx.strokeStyle = "#111314";
  ctx.lineWidth = Math.max(1, w * 0.015);

  ctx.beginPath();
  ctx.arc(shoeX, blanketY - h * 0.1, shoeR, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // ==================================================
  // TORSO / ESPALDA
  // ==================================================

  const torso = new Path2D();

  torso.moveTo(-w * 0.28, blanketY - h * 0.03);
  torso.quadraticCurveTo(
    -w * 0.1,
    blanketY - h * 0.28,
    w * 0.13,
    blanketY - h * 0.22,
  );
  torso.quadraticCurveTo(
    w * 0.23,
    blanketY - h * 0.16,
    w * 0.25,
    blanketY - h * 0.04,
  );
  torso.lineTo(w * 0.1, blanketY + h * 0.05);
  torso.lineTo(-w * 0.25, blanketY + h * 0.08);
  torso.closePath();

  ctx.fillStyle = "#48534d";
  ctx.fill(torso);

  // Líneas de la chaqueta
  ctx.strokeStyle = "rgba(20, 25, 25, 0.35)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(-w * 0.12, blanketY - h * 0.2);
  ctx.lineTo(w * 0.05, blanketY + h * 0.02);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-w * 0.2, blanketY - h * 0.12);
  ctx.lineTo(-w * 0.02, blanketY + h * 0.04);
  ctx.stroke();

  // ==================================================
  // BRAZO
  // ==================================================

  ctx.fillStyle = "#c78f78";

  ctx.beginPath();
  ctx.moveTo(-w * 0.24, blanketY - h * 0.02);
  ctx.quadraticCurveTo(
    -w * 0.35,
    blanketY + h * 0.05,
    -w * 0.2,
    blanketY + h * 0.1,
  );
  ctx.lineTo(-w * 0.04, blanketY + h * 0.05);
  ctx.lineTo(-w * 0.08, blanketY - h * 0.01);
  ctx.closePath();
  ctx.fill();

  // ==================================================
  // ALMOHADA
  // ==================================================

  ctx.fillStyle = "#d2c8b6";

  ctx.beginPath();
  ctx.roundRect(-w * 0.46, blanketY - h * 0.16, w * 0.32, h * 0.14, 5);
  ctx.fill();

  // sombra de almohada
  ctx.strokeStyle = "rgba(70, 60, 50, 0.30)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(-w * 0.42, blanketY - h * 0.03);
  ctx.quadraticCurveTo(
    -w * 0.3,
    blanketY + h * 0.01,
    -w * 0.18,
    blanketY - h * 0.02,
  );
  ctx.stroke();

  // ==================================================
  // CABEZA
  // ==================================================

  ctx.fillStyle = "#b97f6c";

  ctx.beginPath();
  ctx.ellipse(-w * 0.29, blanketY - h * 0.18, w * 0.12, h * 0.12, -0.12, 0, Math.PI * 2);
  ctx.fill();

  // ==================================================
  // CABELLO
  // ==================================================

  ctx.fillStyle = "#2c2523";

  ctx.beginPath();
  ctx.arc(-w * 0.33, blanketY - h * 0.21, w * 0.11, Math.PI, Math.PI * 1.75);
  ctx.fill();

  // mechón
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, blanketY - h * 0.2);
  ctx.lineTo(-w * 0.45, blanketY - h * 0.11);
  ctx.lineTo(-w * 0.38, blanketY - h * 0.16);
  ctx.closePath();
  ctx.fill();

  // ==================================================
  // ROSTRO SIMPLIFICADO
  // ==================================================

  ctx.strokeStyle = "#704b42";
  ctx.lineWidth = 1;

  // nariz
  ctx.beginPath();
  ctx.moveTo(-w * 0.19, blanketY - h * 0.18);
  ctx.lineTo(-w * 0.16, blanketY - h * 0.16);
  ctx.lineTo(-w * 0.19, blanketY - h * 0.15);
  ctx.stroke();

  // ==================================================
  // COBIJA SUPERIOR
  // ==================================================

  const topBlanket = new Path2D();

  topBlanket.moveTo(-w * 0.12, blanketY - h * 0.08);
  topBlanket.quadraticCurveTo(
    w * 0.02,
    blanketY - h * 0.22,
    w * 0.26,
    blanketY - h * 0.15,
  );
  topBlanket.quadraticCurveTo(
    w * 0.4,
    blanketY - h * 0.08,
    w * 0.45,
    blanketY + h * 0.02,
  );
  topBlanket.lineTo(w * 0.34, blanketY + h * 0.16);
  topBlanket.lineTo(-w * 0.05, blanketY + h * 0.05);
  topBlanket.closePath();

  ctx.fillStyle = "#a64f43";
  ctx.fill(topBlanket);

  // ==================================================
  // PLIEGUES DE LA COBIJA
  // ==================================================

  ctx.strokeStyle = "rgba(230, 170, 145, 0.28)";
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 4; i++) {
    const px = -w * 0.02 + i * w * 0.11;

    ctx.beginPath();
    ctx.moveTo(px, blanketY - h * 0.08);
    ctx.quadraticCurveTo(
      px + w * 0.04,
      blanketY + h * 0.01,
      px + w * 0.02,
      blanketY + h * 0.09,
    );
    ctx.stroke();
  }

  // ==================================================
  // CONTORNO GENERAL
  // ==================================================

  // Stroke the actual silhouettes. A bare ctx.stroke() here would re-stroke
  // whatever subpath happened to be current (the last blanket fold), which
  // is not an outline of anything.
  ctx.strokeStyle = "rgba(35, 27, 25, 0.55)";
  ctx.lineWidth = Math.max(1, w * 0.012);

  ctx.stroke(blanket);
  ctx.stroke(topBlanket);

  ctx.restore();
}
