import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetQualityForTests,
  detectInitialTier,
  recordFrameTime,
  TIER_CAPS,
  type Tier,
} from "../src/core/quality";

beforeEach(() => {
  __resetQualityForTests();
});

describe("TIER_CAPS", () => {
  it("matches the documented caps", () => {
    expect(TIER_CAPS.eco).toEqual({ pool: 400, emission: 20 });
    expect(TIER_CAPS.balanced).toEqual({ pool: 1200, emission: 60 });
    expect(TIER_CAPS.cinematic).toEqual({ pool: 3000, emission: 140 });
  });
});

describe("detectInitialTier", () => {
  it("honors an explicit tier", () => {
    expect(detectInitialTier("eco")).toBe("eco");
    expect(detectInitialTier("cinematic")).toBe("cinematic");
    expect(detectInitialTier("balanced")).toBe("balanced");
  });

  it("ignores an invalid explicit tier", () => {
    expect(["eco", "balanced", "cinematic"]).toContain(detectInitialTier("nonsense" as Tier));
  });

  it("returns a defined tier with no explicit", () => {
    const t = detectInitialTier();
    expect(["eco", "balanced", "cinematic"]).toContain(t);
  });
});

describe("recordFrameTime — one-way downgrade", () => {
  it("does not downgrade a single slow 30-frame window", () => {
    const cb = vi.fn();
    for (let i = 0; i < 30; i++) recordFrameTime(40, "cinematic", cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it("downgrades exactly once after two consecutive slow windows", () => {
    const cb = vi.fn();
    for (let i = 0; i < 60; i++) recordFrameTime(40, "cinematic", cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith("balanced");
  });

  it("does not keep downgrading beyond the single allowed step", () => {
    const cb = vi.fn();
    for (let i = 0; i < 300; i++) recordFrameTime(40, "cinematic", cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("resets the slow-window streak after a fast window", () => {
    const cb = vi.fn();
    for (let i = 0; i < 30; i++) recordFrameTime(40, "cinematic", cb);
    for (let i = 0; i < 30; i++) recordFrameTime(2, "cinematic", cb);
    for (let i = 0; i < 30; i++) recordFrameTime(40, "cinematic", cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it("uses the median (one outlier does not poison a window)", () => {
    const cb = vi.fn();
    for (let i = 0; i < 59; i++) recordFrameTime(1, "cinematic", cb);
    recordFrameTime(1000, "cinematic", cb);
    for (let i = 0; i < 60; i++) recordFrameTime(1, "cinematic", cb);
    expect(cb).not.toHaveBeenCalled();
  });
});
