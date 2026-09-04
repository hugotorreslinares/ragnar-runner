// Fallen log — the jungle's crate: common, low, always available.
import { ctx } from "../../../dom.js";
import { GROUND_Y } from "../../../config.js";
import { groundShadow } from "../../../obstacles/utils.js";

export function drawLog(x, w, h) {
  groundShadow(x, w);
  const top = GROUND_Y - h;
  const grad = ctx.createLinearGradient(0, top, 0, GROUND_Y);
  grad.addColorStop(0, "#7a5433");
  grad.addColorStop(1, "#4a3220");
  ctx.fillStyle = grad;
  ctx.fillRect(x - w / 2, top, w, h);

  // End grain on the near face, so it reads as a cut trunk rather than a box.
  ctx.fillStyle = "#8a6440";
  ctx.beginPath();
  ctx.ellipse(x - w / 2, top + h / 2, h * 0.16, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3a2716";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - w / 2, top + h / 2, h * 0.07, h * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Bark lines along the length.
  ctx.strokeStyle = "rgba(40, 26, 14, 0.5)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    const y = top + (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + h * 0.16, y);
    ctx.lineTo(x + w / 2, y);
    ctx.stroke();
  }
}
