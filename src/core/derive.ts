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
  intensity: number;
  speed: number;
  scale: number;
  density: number;
  layers: number;
  field: "turbulence" | "cellular";
  blend: BlendMode;
  distort: number;
  blur: number;
  tint: number;
  bounds: BoundsLevel;
  glassBlur: number;
  glassSaturate: number;
  glassChroma: number;
  glassSpectrumSpeed: number;
}

const FALLBACK_COLOR = "#ffb37c";

type Row<T> = {
  prop: string;
  key: Exclude<keyof ResolvedVars, "color" | "radius">;
  validate: (raw: string | null, fallback: T) => T;
  fallback: T;
};

const TABLE: Row<number>[] = [
  { prop: "--fx-intensity", key: "intensity", validate: numberInRange(0, 1), fallback: 0.6 },
  { prop: "--fx-speed", key: "speed", validate: numberInRange(0.1, 5), fallback: 1 },
  { prop: "--fx-scale", key: "scale", validate: numberInRange(0.1, 5), fallback: 1 },
  { prop: "--fx-density", key: "density", validate: numberInRange(0, 3), fallback: 1.25 },
  { prop: "--fx-layers", key: "layers", validate: numberInRange(1, 12), fallback: 1 },
  { prop: "--fx-distort", key: "distort", validate: numberInRange(0, 1), fallback: 0 },
  { prop: "--fx-blur", key: "blur", validate: numberInRange(0, 40), fallback: 12 },
  { prop: "--fx-tint", key: "tint", validate: numberInRange(0, 1), fallback: 0.15 },
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
    intensity: 0.6,
    speed: 1,
    scale: 1,
    density: 1.25,
    layers: 1,
    field: "turbulence",
    blend: "overlay",
    distort: 0,
    blur: 12,
    tint: 0.15,
    bounds: "normal",
    glassBlur: 12,
    glassSaturate: 180,
    glassChroma: 0.3,
    glassSpectrumSpeed: 1,
  };

  for (const row of TABLE) {
    const raw = style.getPropertyValue(row.prop);
    (vars[row.key] as number) = row.validate(raw, row.fallback);
  }

  vars.layers = Math.round(vars.layers);

  const fieldRaw = style.getPropertyValue("--fx-field");
  vars.field = enumMatch(FIELD_VALUES)(fieldRaw, "turbulence");

  const blendRaw = style.getPropertyValue("--fx-blend");
  vars.blend = enumMatch(BLEND_VALUES)(blendRaw, "overlay");

  const boundsRaw = style.getPropertyValue("--fx-pixie-bounds");
  vars.bounds = enumMatch(BOUNDS_VALUES)(boundsRaw, "normal");

  return vars;
}

function deriveColor(style: CSSStyleDeclaration): string {
  const cc = style.color;
  if (isUsableColor(cc)) return safeColor(cc, "");
  const bg = style.backgroundColor;
  if (isUsableColor(bg)) return safeColor(bg, "");
  return "";
}
