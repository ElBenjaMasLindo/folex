import type { ResolvedVars } from "../core/derive";
import { nextId } from "../core/ids";
import { cellularNoiseTexture, valueNoiseTexture } from "../particles/noise";

let tintCanvas: HTMLCanvasElement | null = null;

function seedFor(hostId: number, layer: number): number {
  return (hostId * 0x1000 + layer + 1) >>> 0;
}

function layerOpacityFor(intensity: number, layers: number): number {
  return Math.max(0.03, intensity / Math.sqrt(layers));
}

function tintedTexture(vars: ResolvedVars, seed: number): string {
  const size = 128;
  if (!tintCanvas) {
    tintCanvas = document.createElement("canvas");
    tintCanvas.width = size;
    tintCanvas.height = size;
  }
  const ctx = tintCanvas.getContext("2d");
  if (!ctx) return "";
  const tex =
    vars.rippleField === "cellular"
      ? cellularNoiseTexture(size, seed, vars.rippleScale)
      : valueNoiseTexture(size, seed, 2);
  ctx.putImageData(tex, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = vars.color;
  ctx.fillRect(0, 0, size, size);
  try {
    return tintCanvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  const hostId = nextId();
  const layers = Math.max(1, Math.min(12, Math.round(vars.rippleLayers)));
  const span = 6 / Math.max(0.1, vars.speed);
  const layerOpacity = layerOpacityFor(vars.rippleIntensity, layers);
  const clip = document.createElement("div");
  clip.className = "fx-ripple-clip";
  for (let i = 0; i < layers; i++) {
    const url = tintedTexture(vars, seedFor(hostId, i));
    const layer = document.createElement("div");
    layer.className = "fx-layer fx-ripple";
    if (url) layer.style.backgroundImage = `url(${url})`;
    layer.style.mixBlendMode = vars.rippleBlend;
    const frac = layers > 1 ? i / (layers - 1) : 0;
    const dur = span * (0.8 + 0.5 * frac);
    layer.style.setProperty("--fx-ripple-dur", `${dur.toFixed(2)}s`);
    layer.style.animationName = "fx-ripple-drift";
    layer.style.animationDelay = `${(-(frac * span) / 2).toFixed(2)}s`;
    layer.style.animationTimingFunction = "ease-in-out";
    layer.style.animationIterationCount = "infinite";
    layer.style.animationDirection = "alternate";
    layer.style.opacity = String(layerOpacity);
    clip.appendChild(layer);
  }
  host.appendChild(clip);
}
