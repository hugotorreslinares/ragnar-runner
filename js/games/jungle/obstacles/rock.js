// Mossy boulder — wider than it is tall, so it is cleared by timing rather
// than by height.
import { ctx } from "../../../dom.js";
import { GROUND_Y } from "../../../config.js";
import { groundShadow } from "../../../obstacles/utils.js";

export function drawRock(x, w, h) {
  groundShadow(x, w);
  const top = GROUND_Y - h;
  ctx.fillStyle = "#6b6560";
  ctx.beginPath();
  ctx.moveTo(x - w / 2, GROUND_Y);
  ctx.lineTo(x - w * 0.36, top + h * 0.28);
  ctx.lineTo(x - w * 0.05, top);
  ctx.lineTo(x + w * 0.3, top + h * 0.18);
  ctx.lineTo(x + w / 2, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Lit face, to give the silhouette some volume.
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.36, top + h * 0.28);
  ctx.lineTo(x - w * 0.05, top);
  ctx.lineTo(x + w * 0.06, top + h * 0.5);
  ctx.lineTo(x - w * 0.22, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Moss on top — the one bit of colour that says "jungle" and not "quarry".
  ctx.fillStyle = "#4c7a35";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.36, top + h * 0.28);
  ctx.quadraticCurveTo(x - w * 0.05, top - h * 0.1, x + w * 0.3, top + h * 0.18);
  ctx.quadraticCurveTo(x - w * 0.02, top + h * 0.3, x - w * 0.36, top + h * 0.28);
  ctx.fill();

  ctx.strokeStyle = "#2f2c29";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, GROUND_Y);
  ctx.lineTo(x - w * 0.36, top + h * 0.28);
  ctx.lineTo(x - w * 0.05, top);
  ctx.lineTo(x + w * 0.3, top + h * 0.18);
  ctx.lineTo(x + w / 2, GROUND_Y);
  ctx.stroke();
}
