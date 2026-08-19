// Drawing helpers shared by more than one obstacle renderer.
import { ctx } from "../dom.js";

export function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Soft contact shadow every obstacle sits on. rx/ry are the ellipse radii.
export function groundShadow(groundY, rx, ry, alpha) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, groundY + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
