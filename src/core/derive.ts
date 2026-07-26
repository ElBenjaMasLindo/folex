import type { BoundsLevel } from "../particles/pool";
import { enumMatch, numberInRange, safeColor } from "./validate";

export type BlendMode =
  | "screen"
  | "multiply"
  | "overlay"
  | "soft-light"
  | "hard-light"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn";

export interface ResolvedVars {
  color: string;
  radius: string;
  speed: number;
  glowIntensity: number;
  glowBlend: BlendMode;
  rippleIntensity: number;
  rippleScale: number;
  rippleLayers: number;
  rippleField: "turbulence" | "cellular";
  rippleBlend: BlendMode;
  rippleDistort: number;
  rippleBlur: number;
  rippleTint: number;
  pixieDensity: number;
  pixieBounds: BoundsLevel;
  pixieScale: number;
  glassIntensity: number;
  glassBlur: number;
  glassSaturate: number;
  glassChroma: number;
  glassSpectrumSpeed: number;
  glassTint: number;
  expTiltMax: number;
  expTiltPerspective: number;
  expTiltScale: number;
  expTiltSpeed: number;
}

const FALLBACK_COLOR = "#ffb37c";

type Row<T> = {
  prop: string;
  key: Exclude<
    keyof ResolvedVars,
    "color" | "radius" | "rippleField" | "glowBlend" | "rippleBlend" | "pixieBounds"
  >;
  validate: (raw: string | null, fallback: T) => T;
  fallback: T;
};

const TABLE: Row<number>[] = [
  { prop: "--fx-speed", key: "speed", validate: numberInRange(0.1, 5), fallback: 1 },
  {
    prop: "--fx-glow-intensity",
    key: "glowIntensity",
    validate: numberInRange(0, 1),
    fallback: 0.6,
  },
  {
    prop: "--fx-ripple-intensity",
    key: "rippleIntensity",
    validate: numberInRange(0, 1),
    fallback: 0.6,
  },
  { prop: "--fx-ripple-scale", key: "rippleScale", validate: numberInRange(0.1, 5), fallback: 1 },
  { prop: "--fx-ripple-layers", key: "rippleLayers", validate: numberInRange(1, 12), fallback: 1 },
  { prop: "--fx-ripple-distort", key: "rippleDistort", validate: numberInRange(0, 1), fallback: 0 },
  { prop: "--fx-ripple-blur", key: "rippleBlur", validate: numberInRange(0, 40), fallback: 12 },
  { prop: "--fx-ripple-tint", key: "rippleTint", validate: numberInRange(0, 1), fallback: 0.15 },
  {
    prop: "--fx-pixie-density",
    key: "pixieDensity",
    validate: numberInRange(0, 3),
    fallback: 1.25,
  },
  { prop: "--fx-pixie-scale", key: "pixieScale", validate: numberInRange(0.1, 5), fallback: 1 },
  {
    prop: "--fx-glass-intensity",
    key: "glassIntensity",
    validate: numberInRange(0, 1),
    fallback: 0.6,
  },
  { prop: "--fx-glass-blur", key: "glassBlur", validate: numberInRange(0, 40), fallback: 12 },
  {
    prop: "--fx-glass-saturate",
    key: "glassSaturate",
    validate: numberInRange(100, 300),
    fallback: 180,
  },
  { prop: "--fx-glass-chroma", key: "glassChroma", validate: numberInRange(0, 1), fallback: 0.3 },
  {
    prop: "--fx-glass-spectrum-speed",
    key: "glassSpectrumSpeed",
    validate: numberInRange(0.1, 5),
    fallback: 1,
  },
  { prop: "--fx-glass-tint", key: "glassTint", validate: numberInRange(0, 1), fallback: 0.15 },
  { prop: "--fx-exp-tilt-max", key: "expTiltMax", validate: numberInRange(1, 45), fallback: 15 },
  {
    prop: "--fx-exp-tilt-perspective",
    key: "expTiltPerspective",
    validate: numberInRange(200, 2000),
    fallback: 800,
  },
  {
    prop: "--fx-exp-tilt-scale",
    key: "expTiltScale",
    validate: numberInRange(1, 1.15),
    fallback: 1.05,
  },
  {
    prop: "--fx-exp-tilt-speed",
    key: "expTiltSpeed",
    validate: numberInRange(0.1, 5),
    fallback: 1,
  },
];

const FIELD_VALUES = ["turbulence", "cellular"] as const;
const BOUNDS_VALUES = ["loose", "normal", "tight", "strict"] as const;
const BLEND_VALUES = [
  "screen",
  "multiply",
  "overlay",
  "soft-light",
  "hard-light",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
] as const;

function isUsableColor(value: string): boolean {
  const s = value.trim().toLowerCase();
  if (s.length === 0 || s === "transparent") return false;
  const m = s.match(/^rgba?\(([^)]*)\)$/);
  if (m) {
    const parts = m[1].split(",").map((p) => p.trim());
    const a = Number.parseFloat(parts[parts.length - 1]);
    if (Number.isFinite(a) && a === 0) return false;
  }
  return true;
}

export function resolveVars(host: HTMLElement): ResolvedVars {
  const style = getComputedStyle(host);

  const explicit = safeColor(style.getPropertyValue("--fx-color"), "");
  const color =
    explicit && isUsableColor(explicit) ? explicit : deriveColor(style) || FALLBACK_COLOR;

  const radius =
    style.borderRadius && style.borderRadius.trim() !== "" ? style.borderRadius : "0px";

  const vars: ResolvedVars = {
    color,
    radius,
    speed: 1,
    glowIntensity: 0.6,
    glowBlend: "overlay",
    rippleIntensity: 0.6,
    rippleScale: 1,
    rippleLayers: 1,
    rippleField: "turbulence",
    rippleBlend: "overlay",
    rippleDistort: 0,
    rippleBlur: 12,
    rippleTint: 0.15,
    pixieDensity: 1.25,
    pixieBounds: "normal",
    pixieScale: 1,
    glassIntensity: 0.6,
    glassBlur: 12,
    glassSaturate: 180,
    glassChroma: 0.3,
    glassSpectrumSpeed: 1,
    glassTint: 0.15,
    expTiltMax: 15,
    expTiltPerspective: 800,
    expTiltScale: 1.05,
    expTiltSpeed: 1,
  };

  for (const row of TABLE) {
    const raw = style.getPropertyValue(row.prop);
    (vars[row.key] as number) = row.validate(raw, row.fallback);
  }

  vars.rippleLayers = Math.round(vars.rippleLayers);

  const rippleFieldRaw = style.getPropertyValue("--fx-ripple-field");
  vars.rippleField = enumMatch(FIELD_VALUES)(rippleFieldRaw, "turbulence");

  const glowBlendRaw = style.getPropertyValue("--fx-glow-blend");
  vars.glowBlend = enumMatch(BLEND_VALUES)(glowBlendRaw, "overlay");

  const rippleBlendRaw = style.getPropertyValue("--fx-ripple-blend");
  vars.rippleBlend = enumMatch(BLEND_VALUES)(rippleBlendRaw, "overlay");

  const pixieBoundsRaw = style.getPropertyValue("--fx-pixie-bounds");
  vars.pixieBounds = enumMatch(BOUNDS_VALUES)(pixieBoundsRaw, "normal");

  return vars;
}

function deriveColor(style: CSSStyleDeclaration): string {
  const cc = style.color;
  if (isUsableColor(cc)) return safeColor(cc, "");
  const bg = style.backgroundColor;
  if (isUsableColor(bg)) return safeColor(bg, "");
  return "";
}
