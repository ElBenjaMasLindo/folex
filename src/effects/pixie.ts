import type { ResolvedVars } from "../core/derive";
import { particleEngine } from "../particles/engine";

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  particleEngine.registerZone(host, vars);
}
