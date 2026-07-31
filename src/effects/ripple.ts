import type { ResolvedVars } from "../core/derive";
import { nextId } from "../core/ids";
import { cellularNoiseTexture, valueNoiseTexture } from "../particles/noise";

import { Option } from "../core/functional";

export type HostId = number & { readonly __brand: "HostId" };

let tintCanvas: Option<HTMLCanvasElement> = Option.none();


function seedFor(hostId: HostId, layer: number): number {
  return ((hostId as number) * 0x1000 + layer + 1) >>> 0;
}

function layerOpacityFor(intensity: number, layers: number): number {
  return Math.max(0.03, intensity / Math.sqrt(layers));
}

function getTintCtx(size: number): Option<CanvasRenderingContext2D> {
  if (!tintCanvas.some) {
    const el = document.createElement("canvas");
    el.width = size;
    el.height = size;
    tintCanvas = Option.some(el);
  }
  const tc = tintCanvas;
  return tc.some ? Option.fromNullable(tc.value.getContext("2d") as CanvasRenderingContext2D) : Option.none();
}





function tintedTexture(vars: ResolvedVars, seed: number): string {
  const size = 128;
  const ctxOpt = getTintCtx(size);
  if (!ctxOpt.some) return "";
  const ctx = ctxOpt.value;

  const tex = vars.rippleField === "cellular"
    ? cellularNoiseTexture(size, seed, vars.rippleScale)
    : valueNoiseTexture(size, seed, 2);
  ctx.putImageData(tex, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = vars.color;
  ctx.fillRect(0, 0, size, size);
  try { return tintCanvas.some ? tintCanvas.value.toDataURL("image/png") : ""; } catch { return ""; }
}


function createRippleLayer(
  vars: ResolvedVars,
  cfg: { hostId: HostId; i: number; layers: number; span: number; opacity: number },
): HTMLDivElement {
  const url = tintedTexture(vars, seedFor(cfg.hostId, cfg.i));
  const layer = document.createElement("div");
  layer.className = "fx-layer fx-ripple";
  if (url) layer.style.backgroundImage = `url(${url})`;
  layer.style.mixBlendMode = vars.rippleBlend;
  const frac = cfg.layers > 1 ? cfg.i / (cfg.layers - 1) : 0;
  const dur = cfg.span * (0.8 + 0.5 * frac);
  layer.style.setProperty("--fx-ripple-dur", `${dur.toFixed(2)}s`);
  layer.style.animationName = "fx-ripple-drift";
  layer.style.animationDelay = `${(-(frac * cfg.span) / 2).toFixed(2)}s`;
  layer.style.animationTimingFunction = "ease-in-out";
  layer.style.animationIterationCount = "infinite";
  layer.style.animationDirection = "alternate";
  layer.style.opacity = String(cfg.opacity);
  return layer;
}

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  const hostId = nextId() as HostId;
  const layers = Math.max(1, Math.min(12, Math.round(vars.rippleLayers)));
  const span = 6 / Math.max(0.1, vars.speed);
  const opacity = layerOpacityFor(vars.rippleIntensity, layers);
  const clip = document.createElement("div");
  clip.className = "fx-ripple-clip";

  for (let i = 0; i < layers; i++) {
    clip.appendChild(createRippleLayer(vars, { hostId, i, layers, span, opacity }));
  }
  host.appendChild(clip);
}


