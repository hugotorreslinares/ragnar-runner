// Everything that touches the canvas 2D context. Pure drawing — no game
// logic or state mutation happens here, only reads of G/assets.
import { ctx, W, H } from "./dom.js";
import {
  GROUND_Y,
  FRAME_ASPECT,
  BG_SWITCH_SCORE,
  BG_ROAD_SRC_Y,
  BG_ROAD_SRC_Y_2,
} from "./config.js";
import { G } from "./state.js";
import {
  sheetImg,
  allLoaded,
  useFallbackArt,
  sheetRect,
  bgImg,
  bgLoaded,
  bgFailed,
  bgImg2,
  bg2Loaded,
  bg2Failed,
} from "./assets.js";
import { starBobPhase } from "./entities.js";

function drawBackground() {
  const useBogota = G.score >= BG_SWITCH_SCORE;
  const img = useBogota ? bgImg2 : bgImg;
  const loaded = useBogota ? bg2Loaded : bgLoaded;
  const failed = useBogota ? bg2Failed : bgFailed;
  const roadSrcY = useBogota ? BG_ROAD_SRC_Y_2 : BG_ROAD_SRC_Y;

  if (loaded) {
    const scale = GROUND_Y / roadSrcY;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dy = GROUND_Y - roadSrcY * scale;
    const parallax = 0.45; // background drifts slower than the foreground for depth
    const totalScroll = G.scrollX * parallax;
    let idx = Math.floor(totalScroll / dw) - 1;
    const limit = totalScroll + W + dw;
    while (idx * dw - totalScroll < limit) {
      const dx = idx * dw - totalScroll;
      ctx.save();
      if (idx % 2 !== 0) {
        // mirror every other tile — the shared edge matches itself exactly,
        // so the repeat has no visible seam even though the art isn't tileable.
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, dw, dh);
      } else {
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      ctx.restore();
      idx++;
    }
    // slight atmospheric haze so the ground band we draw next sits naturally
    const haze = ctx.createLinearGradient(0, GROUND_Y - 60, 0, GROUND_Y);
    haze.addColorStop(0, "rgba(20,26,28,0)");
    haze.addColorStop(1, "rgba(20,26,28,0.25)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, GROUND_Y - 60, W, 60);
  } else {
    // fallback while loading, or if the photo fails for any reason
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, "#61787f");
    skyGrad.addColorStop(1, "#33454b");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GROUND_Y);
    if (failed) {
      ctx.fillStyle = "rgba(20,28,31,0.55)";
      const farOffset = -(G.scrollX * 0.15) % 260;
      for (let x = farOffset - 260; x < W + 260; x += 260) {
        ctx.fillRect(x + 20, 140, 90, GROUND_Y - 140);
        ctx.fillRect(x + 130, 170, 70, GROUND_Y - 170);
        ctx.fillRect(x + 210, 120, 50, GROUND_Y - 120);
      }
    }
  }

  // ground
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  groundGrad.addColorStop(0, "#2c3438");
  groundGrad.addColorStop(1, "#181e20");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = "rgba(232,171,58,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1.5);
  ctx.lineTo(W, GROUND_Y + 1.5);
  ctx.stroke();

  // ground tick marks (scroll-synced, gives motion feedback)
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 3;
  const tickSpacing = 46;
  const off = G.scrollX % tickSpacing;
  for (let x = -off; x < W; x += tickSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 14);
    ctx.lineTo(x - 14, GROUND_Y + 30);
    ctx.stroke();
  }
}
function drawCrate(x, w, h) {
  console.log("🔥 DRAW CRATE NUEVO", x, w, h);
  const top = GROUND_Y - h;

  ctx.save();
  ctx.translate(x, 0);

  // --------------------------------------------------
  // Proporciones
  // --------------------------------------------------
  const halfW = w / 2;

  const topY = top;
  const bottomY = GROUND_Y;

  // El cuerpo se estrecha hacia arriba
  const topHalf = w * 0.39;
  const bottomHalf = w * 0.5;

  // --------------------------------------------------
  // Sombra debajo de la barrera
  // --------------------------------------------------
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, GROUND_Y + 2, w * 0.48, 5, 0, 0, Math.PI * 2);
  ctx.fill();

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

    ctx.lineTo(
      rx + (position > 0 ? w * 0.015 : -w * 0.015),
      bottomY - h * 0.22,
    );

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

function drawTrashCan(x, w, h) {
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

  // ==================================================
  // SOMBRA
  // ==================================================

  ctx.fillStyle = "rgba(0, 0, 0, 0.30)";

  ctx.beginPath();
  ctx.ellipse(0, GROUND_Y + 2, halfW * 0.75, 4, 0, 0, Math.PI * 2);
  ctx.fill();

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

  // Las hacemos pequeñas y regulares para sugerir
  // la malla metálica sin saturar el pixel art.

  ctx.fillStyle = "rgba(35, 39, 40, 0.55)";

  const holeRadius = Math.max(0.7, visualW * 0.012);

  const rows = 5;
  const cols = 7;

  for (let row = 0; row < rows; row++) {
    const py = bodyTop + bodyH * 0.4 + row * (bodyH * 0.065);

    for (let col = 0; col < cols; col++) {
      const offset = row % 2 === 0 ? 0 : visualW * 0.035;

      const px = -visualW * 0.3 + col * (visualW * 0.095) + offset;

      if (Math.abs(px) > halfW * 0.7) continue;

      ctx.beginPath();
      ctx.arc(px, py, holeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

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

function drawBarrel(x, w, h) {
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
  //ctx.fillRect(-w/2, top + h*0.62, w, h*0.09);
  ctx.strokeStyle = "#0e1113";
  ctx.lineWidth = 2;
  roundRect(-w / 2, top, w, h, w * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawDumpster(x, w, h) {
  const top = GROUND_Y - h;

  ctx.save();
  ctx.translate(x, 0);

  // ==================================================
  // PROPORCIONES
  // ==================================================

  const halfW = w / 2;

  const bodyTop = top + h * 0.18;
  const bodyBottom = GROUND_Y - h * 0.08;

  // ==================================================
  // SOMBRA
  // ==================================================

  ctx.fillStyle = "rgba(0, 0, 0, 0.30)";

  ctx.beginPath();
  ctx.ellipse(0, GROUND_Y + 2, w * 0.48, 4, 0, 0, Math.PI * 2);

  ctx.fill();

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

function drawStar(x, y, r, bob) {
  const yy = y + Math.sin(bob) * 5;
  ctx.save();
  ctx.translate(x, yy);
  ctx.rotate(Math.sin(bob * 0.6) * 0.15);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = -Math.PI / 2 + i * ((Math.PI * 2) / 5);
    const innerA = outerA + Math.PI / 5;
    ctx.lineTo(Math.cos(outerA) * r, Math.sin(outerA) * r);
    ctx.lineTo(Math.cos(innerA) * r * 0.42, Math.sin(innerA) * r * 0.42);
  }
  ctx.closePath();
  ctx.fillStyle = "#e8ab3a";
  ctx.shadowColor = "rgba(232,171,58,0.7)";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#8a6a26";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Same crate/barrel look as drawCrate/drawBarrel, but centered on (0,0) so
// the caller can translate+rotate it freely — used for flying debris.
function drawDebrisPiece(d) {
  const w = d.w,
    h = d.h,
    top = -h / 2;
  if (d.type === "crate") {
    ctx.fillStyle = "#6b4a2b";
    ctx.fillRect(-w / 2, top, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(-w / 2, top, w, 6);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + (w / 3) * i, top);
      ctx.lineTo(-w / 2 + (w / 3) * i, top + h);
      ctx.stroke();
    }
    ctx.strokeStyle = "#2b1c10";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, top, w, h);
  } else {
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, "#2a2f33");
    grad.addColorStop(0.5, "#4d565b");
    grad.addColorStop(1, "#22262a");
    ctx.fillStyle = grad;
    roundRect(-w / 2, top, w, h, w * 0.28);
    ctx.fill();
    ctx.fillStyle = "#e8ab3a";
    ctx.fillRect(-w / 2, top + h * 0.22, w, h * 0.09);
    ctx.fillRect(-w / 2, top + h * 0.62, w, h * 0.09);
    ctx.strokeStyle = "#0e1113";
    ctx.lineWidth = 2;
    roundRect(-w / 2, top, w, h, w * 0.28);
    ctx.stroke();
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFallbackRunner(feetY, topY, drawH, drawW, phase, facing) {
  // A simple, readable vector runner used only if the sprite art fails to load.
  ctx.save();
  ctx.translate(0, 0);
  const cx = 0;
  const legSwing = Math.sin(phase) * drawW * 0.28;
  const armSwing = Math.sin(phase + Math.PI) * drawW * 0.22;
  const bodyTop = topY + drawH * 0.28;
  const bodyBot = topY + drawH * 0.72;
  const hipY = bodyBot;
  const headR = drawH * 0.13;

  ctx.strokeStyle = "#e9e4d6";
  ctx.fillStyle = "#c9a876";
  ctx.lineWidth = Math.max(3, drawW * 0.09);
  ctx.lineCap = "round";

  // back leg
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - legSwing, feetY);
  ctx.strokeStyle = "#2c2440";
  ctx.stroke();
  // front leg
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + legSwing, feetY);
  ctx.strokeStyle = "#3a2f56";
  ctx.stroke();

  // torso
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + drawW * 0.05, bodyTop);
  ctx.strokeStyle = "#c9a876";
  ctx.stroke();

  // back arm
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + drawH * 0.06);
  ctx.lineTo(cx - armSwing, bodyTop + drawH * 0.22);
  ctx.strokeStyle = "#b3906a";
  ctx.stroke();
  // front arm
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + drawH * 0.06);
  ctx.lineTo(cx + armSwing, bodyTop + drawH * 0.22);
  ctx.strokeStyle = "#c9a876";
  ctx.stroke();

  // head
  ctx.beginPath();
  ctx.fillStyle = "#c9a876";
  ctx.arc(cx + drawW * 0.05, bodyTop - headR * 0.6, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a26";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawPlayer() {
  const pDrawH = 150;
  const pDrawW = pDrawH / FRAME_ASPECT;
  const feetY = GROUND_Y + G.player.y;
  const topY = feetY - pDrawH;

  ctx.save();
  if (G.player.invuln > 0 && Math.floor(G.player.invuln * 16) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }
  ctx.translate(G.player.screenX, 0);
  if (G.player.facing < 0) ctx.scale(-1, 1);

  if (!allLoaded) {
    ctx.restore();
    return; // nothing to draw yet, still within the initial load grace period
  }

  if (useFallbackArt) {
    const phase = G.player.onGround ? G.player.animPhase * 2 : Math.PI / 2;
    drawFallbackRunner(feetY, topY, pDrawH, pDrawW, phase, G.player.facing);
  } else if (sheetImg.complete && sheetImg.naturalWidth > 0) {
    // Derive the source rectangle purely from (animation, frameIndex) —
    // this is the whole "spritesheet" trick: one image, computed offsets.
    const { sx, sy, sw, sh } = sheetRect(G.player.curAnim, G.player.curFrame);
    ctx.drawImage(sheetImg, sx, sy, sw, sh, -pDrawW / 2, topY, pDrawW, pDrawH);
  } else {
    drawFallbackRunner(
      feetY,
      topY,
      pDrawH,
      pDrawW,
      G.player.animPhase * 2,
      G.player.facing,
    );
  }
  ctx.restore();

  // soft contact shadow
  ctx.save();
  const squash = G.player.onGround
    ? 1
    : Math.max(0.35, 1 - Math.abs(G.player.y) / 220);
  ctx.translate(G.player.screenX, GROUND_Y + 2);
  ctx.scale(squash, 1);
  const shGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
  shGrad.addColorStop(0, "rgba(0,0,0,0.42)");
  shGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function draw() {
  ctx.save();
  if (G.shakeT > 0) {
    const m = G.shakeT * 55;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m * 0.5);
  }
  drawBackground();

  for (const o of G.obstacles) {
    const ox = o.worldX - G.scrollX;
    if (ox < -100 || ox > W + 100) continue;
    if (o.type === "crate") {
      drawCrate(ox, o.w * 2, o.h);
    } else if (o.type === "barrel") {
      drawBarrel(ox, o.w, o.h);
    } else if (o.type === "trashcan") {
      drawTrashCan(ox, o.w, o.h);
    } else if (o.type === "dumpster") {
      drawDumpster(ox, o.w * 2, o.h);
    }
  }

  for (const d of G.debris) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = Math.max(0, 1 - d.t / 0.9);
    drawDebrisPiece(d);
    ctx.restore();
  }

  for (const s of G.stars) {
    if (s.caught) continue;
    const sx = s.worldX - G.scrollX;
    if (sx < -60 || sx > W + 60) continue;
    drawStar(sx, GROUND_Y - s.groundOffset, s.r, starBobPhase(s));
  }

  drawPlayer();

  for (const p of G.starPopups) {
    const px = p.worldX - G.scrollX;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.t);
    ctx.fillStyle = "#e8ab3a";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("+1", px, p.y);
    ctx.restore();
  }

  if (G.starPop > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.starPop);
    ctx.fillStyle = "#e8ab3a";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("+1 LIFE", W / 2, 60);
    ctx.restore();
  }

  if (G.hitFlash > 0) {
    // full-screen red pulse + a "-1" popup, so a hit is unmistakable even
    // if the player didn't clearly see the obstacle clip them.
    ctx.save();
    ctx.fillStyle = "rgba(196,69,58," + G.hitFlash * 0.45 + ")";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, G.hitFlash * 1.5);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText("-1", G.player.screenX, GROUND_Y + G.player.y - 170);
    ctx.restore();
  }

  if (!allLoaded) {
    ctx.fillStyle = "#e9e4d6";
    ctx.font = "14px monospace";
    ctx.fillText("loading sprites…", 20, 30);
  }
  ctx.restore();
}
