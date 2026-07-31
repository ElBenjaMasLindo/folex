import { describe, expect, it } from "vitest";
import { springAtRest, springStep } from "../src/physics/spring";

describe("springStep", () => {
  it("moves position towards target", () => {
    let state = { pos: 0, vel: 0 };
    const target = 10;
    const config = { stiffness: 120, damping: 12, dt: 0.016 };

    for (let i = 0; i < 60; i++) {
      const [pos, vel] = springStep(state, target, config);
      state = { pos, vel };
    }

    expect(state.pos).toBeGreaterThan(8);
  });
});

describe("springAtRest", () => {
  it("returns true when position matches target and velocity is small", () => {
    expect(springAtRest({ pos: 10, vel: 0.001 }, 10)).toBe(true);
    expect(springAtRest({ pos: 10, vel: 0.5 }, 10)).toBe(false);
    expect(springAtRest({ pos: 8, vel: 0 }, 10)).toBe(false);
  });
});
