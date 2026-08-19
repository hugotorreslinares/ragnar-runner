// Plain rounded barrel with a single reflective band.
import { ctx } from "../dom.js";
import { GROUND_Y } from "../config.js";
import { roundRect } from "./utils.js";

export function drawBarrel(x, w, h) {
  const top = GROUND_Y - h;
  ctx.save();
  ctx.translate(x, 0);
  const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, "#545556");
  grad.addColorStop(0.5, "#4d565b");
  grad.addColorStop(1, "#22262a");
  ctx.fillStyle = grad;
  roundRect(-w / 2, top, w, h, w * 0.28);
  ctx.fill();
  ctx.fillStyle = "#f7f3ed";
  ctx.fillRect(-w / 2, top + h * 0.22, w, h * 0.09);
  ctx.strokeStyle = "#0e1113";
  ctx.lineWidth = 2;
  roundRect(-w / 2, top, w, h, w * 0.28);
  ctx.stroke();
  ctx.restore();
}
