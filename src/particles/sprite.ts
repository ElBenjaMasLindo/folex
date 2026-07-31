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

export interface RayConfig {
  length: number;
  baseWidth: number;
  angleDeg: number;
}

type AnyContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function ray(ctx: AnyContext, center: { cx: number; cy: number }, cfg: RayConfig): void {
  const rad = (cfg.angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const px = -dy;
  const py = dx;
  const hw = cfg.baseWidth / 2;
  ctx.beginPath();
  ctx.moveTo(center.cx + px * hw, center.cy + py * hw);
  ctx.lineTo(center.cx - px * hw, center.cy - py * hw);
  ctx.lineTo(center.cx + dx * cfg.length, center.cy + dy * cfg.length);
  ctx.closePath();
  ctx.fill();
}

function drawSpriteRays(ctx: AnyContext, center: { cx: number; cy: number }, sizePx: number): void {
  for (const a of [0, 90, 180, 270]) {
    ray(ctx, center, { length: sizePx * 0.5, baseWidth: sizePx * 0.12, angleDeg: a });
  }
  for (const a of [45, 135, 225, 315]) {
    ray(ctx, center, { length: sizePx * 0.28, baseWidth: sizePx * 0.06, angleDeg: a });
  }
}

function drawSpritePattern(ctx: AnyContext, color: string, sizePx: number): void {
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const center = { cx, cy };
  const coreR = sizePx * 0.18;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  drawSpriteRays(ctx, center, sizePx);
}

export function buildSprite(color: string, sizePx: number): AnyCanvas {
  const key = `${color}:${sizePx}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = createCanvas(sizePx);
  const rawCtx = canvas.getContext("2d");
  if (rawCtx) {
    drawSpritePattern(rawCtx as AnyContext, color, sizePx);
  }

  cache.set(key, canvas);
  return canvas;
}
