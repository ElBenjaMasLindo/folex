import { describe, expect, it } from "vitest";
import { MotePool } from "../src/particles/pool";

describe("MotePool — cap is never exceeded", () => {
  it("pre-allocates to the cap", () => {
    const p = new MotePool(5);
    expect(p.activeCount).toBe(0);
  });

  it("spawn returns true up to the cap", () => {
    const p = new MotePool(3);
    expect(p.spawn({ life: 1 })).toBe(true);
    expect(p.spawn({ life: 1 })).toBe(true);
    expect(p.spawn({ life: 1 })).toBe(true);
    expect(p.activeCount).toBe(3);
  });

  it("spawn returns false and does nothing beyond the cap", () => {
    const p = new MotePool(2);
    p.spawn({ life: 1 });
    p.spawn({ life: 1 });
    for (let i = 0; i < 50; i++) expect(p.spawn({ life: 1 })).toBe(false);
    expect(p.activeCount).toBe(2);
  });
});

describe("MotePool — lifecycle", () => {
  it("removes dead motes via swap-with-last", () => {
    const p = new MotePool(10);
    for (let i = 0; i < 5; i++) p.spawn({ life: 2 - i * 0.5, vx: i });
    p.step(1.0, 0);
    // motes with life <= 1 after dt=1 are removed: lives 2,1.5,1,0.5,0 → after step
    // life reduces by 1 → 1, 0.5, 0, -0.5, -1 → 3 removed, 2 remain
    expect(p.activeCount).toBe(2);
    p.forEachActive((m) => expect(m.life).toBeGreaterThan(0));
  });

  it("forEachActive only visits live motes", () => {
    const p = new MotePool(8);
    p.spawn({ life: 5 });
    p.spawn({ life: 0.1 });
    p.spawn({ life: 5 });
    p.step(0.2, 0);
    let count = 0;
    p.forEachActive(() => (count += 1));
    expect(count).toBe(p.activeCount);
  });

  it("advances rotation by angularVelocity each step", () => {
    const p = new MotePool(2);
    p.spawn({ life: 5, rotation: 0, angularVelocity: 1.5 });
    p.step(0.5, 0);
    p.forEachActive((m) => expect(m.rotation).toBeCloseTo(0.75, 6));
  });
});

describe("MotePool — setCap shrink", () => {
  it("lowers the cap so further spawns are blocked while active exceeds it", () => {
    const p = new MotePool(10);
    for (let i = 0; i < 10; i++) p.spawn({ life: 100 });
    p.setCap(3);
    expect(p.activeCount).toBe(10);
    expect(p.spawn({ life: 1 })).toBe(false);
    expect(p.activeCount).toBe(10);
  });

  it("never raises the cap", () => {
    const p = new MotePool(2);
    p.setCap(99);
    expect(p.currentCap).toBe(2);
  });

  it("allows spawning again once active drains below the new cap", () => {
    const p = new MotePool(10);
    for (let i = 0; i < 10; i++) p.spawn({ life: 1 });
    p.setCap(2);
    p.step(1.0, 0); // all motes die
    expect(p.activeCount).toBe(0);
    expect(p.spawn({ life: 1 })).toBe(true);
    expect(p.spawn({ life: 1 })).toBe(true);
    expect(p.spawn({ life: 1 })).toBe(false);
  });
});
