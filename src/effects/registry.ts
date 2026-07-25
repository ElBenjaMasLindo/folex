import type { ResolvedVars } from "../core/derive";
import * as glass from "./glass";
import * as glow from "./glow";
import * as pixie from "./pixie";
import * as ripple from "./ripple";
import * as tilt from "./tilt";

export type EffectName = string;
export type EffectSetup = (host: HTMLElement, vars: ResolvedVars) => void;
export type EffectRegistry = Record<EffectName, EffectSetup>;

export const registry: EffectRegistry = {
  glass: glass.setup,
  glow: glow.setup,
  ripple: ripple.setup,
  pixie: pixie.setup,
  "exp-tilt": tilt.setup,
};
