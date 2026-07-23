export interface MoteBehavior {
  readonly spin: (rand: number) => number;
  readonly scale: (lifeFrac: number) => number;
  readonly fade: (lifeFrac: number, base: number) => number;
}

export const BEHAVIORS: readonly MoteBehavior[] = [
  {
    spin: (r) => 1 + r * 3,
    scale: (f) => Math.sin(f * Math.PI),
    fade: (_f, base) => base,
  },
  {
    spin: (r) => 0.2 + r * 0.6,
    scale: () => 1,
    fade: (_f, base) => base,
  },
  {
    spin: (r) => 0.5 + r * 1.5,
    scale: (f) => {
      const t = 1 - f;
      if (t < 0.85) return t * 0.588;
      return 0.5 + (t - 0.85) * 3.33;
    },
    fade: (f, base) => (f < 0.15 ? base * (f / 0.15) : base),
  },
];
