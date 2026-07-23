type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

const cache = new Map<string, AnyCanvas>();

function createCanvas(sizePx: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    try {
      return new OffscreenCanvas(sizePx, sizePx);
    } catch {
      // fall through to a regular canvas element
    }
  }
  const el = document.createElement("canvas");
  el.width = sizePx;
  el.height = sizePx;
  return el;
}

function ray(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  baseWidth: number,
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const px = -dy;
  const py = dx;
  const hw = baseWidth / 2;
  ctx.beginPath();
  ctx.moveTo(cx + px * hw, cy + py * hw);
  ctx.lineTo(cx - px * hw, cy - py * hw);
  ctx.lineTo(cx + dx * length, cy + dy * length);
  ctx.closePath();
  ctx.fill();
}

export function buildSprite(color: string, sizePx: number): AnyCanvas {
  const key = `${color}:${sizePx}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = createCanvas(sizePx);
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (ctx) {
    const cx = sizePx / 2;
    const cy = sizePx / 2;
    const coreR = sizePx * 0.18;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    for (const a of [0, 90, 180, 270]) ray(ctx, cx, cy, sizePx * 0.5, sizePx * 0.12, a);
    for (const a of [45, 135, 225, 315]) ray(ctx, cx, cy, sizePx * 0.28, sizePx * 0.06, a);
  }

  cache.set(key, canvas);
  return canvas;
}
