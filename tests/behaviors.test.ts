import { describe, expect, it } from "vitest";
import { BEHAVIORS } from "../src/particles/behaviors";

describe("BEHAVIORS — spin profile", () => {
  it("spin produces a positive angular velocity in the expected band per kind", () => {
    for (let trial = 0; trial < 50; trial++) {
      const r = Math.random();
      const v0 = BEHAVIORS[0].spin(r);
      const v1 = BEHAVIORS[1].spin(r);
      const v2 = BEHAVIORS[2].spin(r);
      expect(v0).toBeGreaterThan(0);
      expect(v1).toBeGreaterThan(0);
      expect(v2).toBeGreaterThan(0);
      expect(v1).toBeLessThan(v0);
    }
  });
});

describe("BEHAVIORS — scale profile", () => {
  it("spin: zero at birth, peak at mid-life, zero at death", () => {
    expect(BEHAVIORS[0].scale(1)).toBeCloseTo(0, 6);
    expect(BEHAVIORS[0].scale(0.5)).toBeCloseTo(1, 6);
    expect(BEHAVIORS[0].scale(0)).toBeCloseTo(0, 6);
  });

  it("glow: always 1", () => {
    for (const f of [1, 0.8, 0.5, 0.2, 0]) {
      expect(BEHAVIORS[1].scale(f)).toBe(1);
    }
  });

  it("burst: starts at 0, grows to 0.5 at 85% life, pops to 1.0 at death", () => {
    expect(BEHAVIORS[2].scale(1)).toBeCloseTo(0, 6);
    expect(BEHAVIORS[2].scale(0.15)).toBeCloseTo(0.5, 3);
    expect(BEHAVIORS[2].scale(0)).toBeCloseTo(1, 3);
  });
});

describe("BEHAVIORS — fade profile", () => {
  it("spin and glow pass fade through unchanged", () => {
    expect(BEHAVIORS[0].fade(0.5, 0.7)).toBe(0.7);
    expect(BEHAVIORS[1].fade(0.1, 0.3)).toBe(0.3);
  });

  it("burst fades to 0 during the last 15% of life", () => {
    expect(BEHAVIORS[2].fade(0.2, 1)).toBe(1);
    expect(BEHAVIORS[2].fade(0.075, 1)).toBeCloseTo(0.5, 6);
    expect(BEHAVIORS[2].fade(0, 1)).toBeCloseTo(0, 6);
  });
});
