import type { ResolvedVars } from "../core/derive";

// One animation per host — cancel before replacing
const _anims = new WeakMap<HTMLElement, Animation>();

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  const i = vars.intensity;

  // Layer 1: edge gradient diffusion (intermediate blur 2-5px, tight spread, high opacity)
  const blur1 = Math.round(2 + 3 * i);
  const spread1 = 1;
  const innerAlpha = Math.round(0xaa + 0x55 * i)
    .toString(16)
    .padStart(2, "0");

  // Layer 2: ambient breathing glow (large blur, animated spread/blur, low alpha)
  const blur2 = Math.round(12 + 40 * i);
  const spread2 = Math.round(2 + 8 * i);
  const outerAlpha = Math.round(0x10 + 0x40 * i)
    .toString(16)
    .padStart(2, "0");

  const baseShadow = `0 0 ${blur1}px ${spread1}px ${vars.color}${innerAlpha}, 0 0 ${blur2}px ${spread2}px ${vars.color}${outerAlpha}`;

  const pulseBlur2 = Math.round(blur2 * 1.18);
  const pulseSpread2 = Math.round(spread2 * 1.18);
  const pulseShadow = `0 0 ${blur1}px ${spread1}px ${vars.color}${innerAlpha}, 0 0 ${pulseBlur2}px ${pulseSpread2}px ${vars.color}${outerAlpha}`;

  const existing = getComputedStyle(host).boxShadow;
  const composedBase = existing && existing !== "none" ? `${baseShadow}, ${existing}` : baseShadow;
  const composedPulse =
    existing && existing !== "none" ? `${pulseShadow}, ${existing}` : pulseShadow;

  host.style.boxShadow = composedBase;

  _anims.get(host)?.cancel();

  const dur = (4 / Math.max(0.1, vars.speed)) * 1000;
  const anim = host.animate([{ boxShadow: composedBase }, { boxShadow: composedPulse }], {
    duration: dur,
    iterations: Infinity,
    direction: "alternate",
    easing: "ease-in-out",
  });
  _anims.set(host, anim);
}
