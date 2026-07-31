import { describe, expect, it } from "vitest";
import {
  createMotePool,
  motePoolActiveCount,
  motePoolCurrentCap,
  motePoolForEachActive,
  motePoolSetCap,
  motePoolSpawn,
  motePoolStep,
} from "../src/particles/pool";

describe("MotePool — cap is never exceeded", () => {
  it("pre-allocates to the cap", () => {
    const p = createMotePool(5);
    expect(motePoolActiveCount(p)).toBe(0);
  });

  it("spawn returns true up to the cap", () => {
    const p = createMotePool(3);
    expect(motePoolSpawn(p, { life: 1 })).toBe(true);
    expect(motePoolSpawn(p, { life: 1 })).toBe(true);
    expect(motePoolSpawn(p, { life: 1 })).toBe(true);
    expect(motePoolActiveCount(p)).toBe(3);
  });

  it("spawn returns false and does nothing beyond the cap", () => {
    const p = createMotePool(2);
    motePoolSpawn(p, { life: 1 });
    motePoolSpawn(p, { life: 1 });
    for (let i = 0; i < 50; i++) expect(motePoolSpawn(p, { life: 1 })).toBe(false);
    expect(motePoolActiveCount(p)).toBe(2);
  });
});

describe("MotePool — lifecycle", () => {
  it("removes dead motes via swap-with-last", () => {
    const p = createMotePool(10);
    for (let i = 0; i < 5; i++) motePoolSpawn(p, { life: 2 - i * 0.5, vx: i });
    motePoolStep(p, 1.0, 0);
    expect(motePoolActiveCount(p)).toBe(2);
    motePoolForEachActive(p, (m) => expect(m.life).toBeGreaterThan(0));
  });

  it("forEachActive only visits live motes", () => {
    const p = createMotePool(8);
    motePoolSpawn(p, { life: 5 });
    motePoolSpawn(p, { life: 0.1 });
    motePoolSpawn(p, { life: 5 });
    motePoolStep(p, 0.2, 0);
    let count = 0;
    motePoolForEachActive(p, () => (count += 1));
    expect(count).toBe(motePoolActiveCount(p));
  });

  it("advances rotation by angularVelocity each step", () => {
    const p = createMotePool(2);
    motePoolSpawn(p, { life: 5, rotation: 0, angularVelocity: 1.5 });
    motePoolStep(p, 0.5, 0);
    motePoolForEachActive(p, (m) => expect(m.rotation).toBeCloseTo(0.75, 6));
  });
});

describe("MotePool — setCap shrink", () => {
  it("lowers the cap so further spawns are blocked while active exceeds it", () => {
    const p = createMotePool(10);
    for (let i = 0; i < 10; i++) motePoolSpawn(p, { life: 100 });
    motePoolSetCap(p, 3);
    expect(motePoolActiveCount(p)).toBe(10);
    expect(motePoolSpawn(p, { life: 1 })).toBe(false);
    expect(motePoolActiveCount(p)).toBe(10);
  });

  it("never raises the cap", () => {
    const p = createMotePool(2);
    motePoolSetCap(p, 99);
    expect(motePoolCurrentCap(p)).toBe(2);
  });

  it("allows spawning again once active drains below the new cap", () => {
    const p = createMotePool(10);
    for (let i = 0; i < 10; i++) motePoolSpawn(p, { life: 1 });
    motePoolSetCap(p, 2);
    motePoolStep(p, 1.0, 0);
    expect(motePoolActiveCount(p)).toBe(0);
    expect(motePoolSpawn(p, { life: 1 })).toBe(true);
    expect(motePoolSpawn(p, { life: 1 })).toBe(true);
    expect(motePoolSpawn(p, { life: 1 })).toBe(false);
  });
});
