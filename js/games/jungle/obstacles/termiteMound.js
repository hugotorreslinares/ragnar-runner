// Termite mound — tall and narrow. The height is what makes it hard, so the
// hitbox stays slim and the art leans past it.
import { ctx } from "../../../dom.js";
import { GROUND_Y } from "../../../config.js";
import { groundShadow } from "../../../obstacles/utils.js";

export function drawTermiteMound(x, w, h) {
  groundShadow(x, w);
  const top = GROUND_Y - h;
  const grad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  grad.addColorStop(0, "#8a5a35");
  grad.addColorStop(0.45, "#a97144");
  grad.addColorStop(1, "#6b422540");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, GROUND_Y);
  ctx.quadraticCurveTo(x - w * 0.3, top + h * 0.25, x - w * 0.08, top);
  ctx.quadraticCurveTo(x + w * 0.22, top + h * 0.2, x + w / 2, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Ridges down the spire.
  ctx.strokeStyle = "rgba(60, 34, 16, 0.45)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) {
    const y = top + (h / 5) * i;
    const half = (w / 2) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(x - half, y);
    ctx.lineTo(x + half * 0.8, y + h * 0.03);
    ctx.stroke();
  }
}
