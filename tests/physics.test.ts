import { describe, expect, it } from "vitest";
import { springAtRest, springStep } from "../src/physics/spring";

describe("springStep", () => {
  it("moves position towards target", () => {
    let pos = 0;
    let vel = 0;
    const target = 10;
    const stiffness = 120;
    const damping = 12;
    const dt = 0.016;

    for (let i = 0; i < 60; i++) {
      [pos, vel] = springStep(pos, vel, target, stiffness, damping, dt);
    }

    expect(pos).toBeGreaterThan(8);
  });
});

describe("springAtRest", () => {
  it("returns true when position matches target and velocity is small", () => {
    expect(springAtRest(10, 0.001, 10)).toBe(true);
    expect(springAtRest(10, 0.5, 10)).toBe(false);
    expect(springAtRest(8, 0, 10)).toBe(false);
  });
});
