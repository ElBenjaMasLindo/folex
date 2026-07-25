import type { ResolvedVars } from "../core/derive";

type GamutCorrection = {
  min: number;
  max: number;
  peak: number;
  dL: number;
  dC: number;
};

const GAMUT_CORRECTIONS: GamutCorrection[] = [
  { min: 60, max: 110, peak: 85, dL: 20, dC: -0.05 },
  { min: 110, max: 160, peak: 135, dL: 12, dC: 0 },
  { min: 230, max: 290, peak: 260, dL: -8, dC: 0.03 },
];

// Canvas pixel readback resolves any CSS color (hsl, oklch, named, etc.) to concrete RGB.
let _colorParseCanvas: HTMLCanvasElement | null = null;

function hueFromColor(cssColor: string): number {
  if (!_colorParseCanvas) {
    _colorParseCanvas = document.createElement("canvas");
    _colorParseCanvas.width = 1;
    _colorParseCanvas.height = 1;
  }
  const ctx = _colorParseCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;

  const delta = max - min;
  let h: number;
  if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / delta + 2) * 60;
  else h = ((r - g) / delta + 4) * 60;
  return Math.round(h);
}

function getAestheticColor(baseHue: number): string {
  const normHue = ((baseHue % 360) + 360) % 360;
  let l = 68;
  let c = 0.22;

  for (const corr of GAMUT_CORRECTIONS) {
    if (normHue >= corr.min && normHue <= corr.max) {
      const factor = 1 - Math.abs(normHue - corr.peak) / ((corr.max - corr.min) / 2);
      l += corr.dL * factor;
      c += corr.dC * factor;
      break;
    }
  }

  return `oklch(${l.toFixed(1)}% ${c.toFixed(3)} ${normHue.toFixed(1)})`;
}

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  const baseHue = hueFromColor(vars.color);

  const instanceShift = Math.random() * 40 - 20;
  const dir = Math.random() > 0.5 ? 1 : -1;
  const hueCenter = baseHue + instanceShift;

  const offsets = [-120, -80, -40, 0, 40, 80, 120];
  const gradientStops = offsets
    .map((offset) => getAestheticColor(hueCenter + offset * dir))
    .join(", ");

  const speedVariance = 1 + (Math.random() * 0.4 - 0.2);
  const specDur = (8 / Math.max(0.1, vars.glassSpectrumSpeed)) * speedVariance;

  const chromaC1 = getAestheticColor(hueCenter + 40);
  const chromaC2 = getAestheticColor(hueCenter - 40);

  const clip = document.createElement("div");
  clip.className = "fx-glass-clip";

  clip.style.setProperty("--fx-glass-frost-blur", `${vars.glassBlur}px`);
  clip.style.setProperty("--fx-glass-frost-sat", `${vars.glassSaturate}%`);
  clip.style.setProperty(
    "--fx-glass-frost-shadow",
    `inset 0 0 40px color-mix(in oklch, ${vars.color} ${Math.round(vars.glassTint * 100)}%, transparent)`,
  );
  clip.style.setProperty("--fx-glass-spectrum-bg", `linear-gradient(135deg, ${gradientStops})`);
  clip.style.setProperty("--fx-glass-spectrum-op", String(vars.glassIntensity * 0.4));
  clip.style.setProperty("--fx-glass-spectrum-dur", `${specDur.toFixed(2)}s`);
  clip.style.setProperty("--fx-glass-chroma-op", String(vars.glassIntensity * vars.glassChroma));
  clip.style.setProperty("--fx-glass-chroma-c1", chromaC1);
  clip.style.setProperty("--fx-glass-chroma-c2", chromaC2);

  clip.innerHTML = `
    <div class="fx-glass-prism"></div>
    <div class="fx-layer fx-glass-spectrum"></div>
    <div class="fx-layer fx-glass-chroma"></div>
    <div class="fx-layer fx-glass-highlight"></div>
  `;

  if (window.getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }
  host.style.zIndex = "0";
  host.appendChild(clip);
}
