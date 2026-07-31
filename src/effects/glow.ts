import type { ResolvedVars } from "../core/derive";

// One animation per host — cancel before replacing
const _anims = new WeakMap<HTMLElement, Animation>();

function computeShadows(vars: ResolvedVars, existing: string) {
  const i = vars.glowIntensity;
  const blur1 = Math.round(2 + 3 * i);
  const innerAlpha = Math.round(0xaa + 0x55 * i).toString(16).padStart(2, "0");
  const blur2 = Math.round(12 + 40 * i);
  const spread2 = Math.round(2 + 8 * i);
  const outerAlpha = Math.round(0x10 + 0x40 * i).toString(16).padStart(2, "0");

  const baseShadow = `0 0 ${blur1}px 1px ${vars.color}${innerAlpha}, 0 0 ${blur2}px ${spread2}px ${vars.color}${outerAlpha}`;
  const pulseShadow = `0 0 ${blur1}px 1px ${vars.color}${innerAlpha}, 0 0 ${Math.round(blur2 * 1.18)}px ${Math.round(spread2 * 1.18)}px ${vars.color}${outerAlpha}`;
  const hasExisting = existing && existing !== "none";
  return {
    composedBase: hasExisting ? `${baseShadow}, ${existing}` : baseShadow,
    composedPulse: hasExisting ? `${pulseShadow}, ${existing}` : pulseShadow,
  };
}

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  const existing = getComputedStyle(host).boxShadow;
  const { composedBase, composedPulse } = computeShadows(vars, existing);

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

