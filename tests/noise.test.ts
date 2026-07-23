import { describe, expect, it } from "vitest";
import { cellularNoiseTexture, valueNoiseTexture } from "../src/particles/noise";

function bytes(id: ImageData): Uint8Array {
  return new Uint8Array(id.data.buffer.slice(0));
}

describe("valueNoiseTexture", () => {
  it("returns an ImageData of the requested size", () => {
    const id = valueNoiseTexture(128, 1, 2);
    expect(id.width).toBe(128);
    expect(id.height).toBe(128);
    expect(id.data.length).toBe(128 * 128 * 4);
  });

  it("is deterministic for a fixed seed", () => {
    const a = bytes(valueNoiseTexture(128, 42, 2));
    const b = bytes(valueNoiseTexture(128, 42, 2));
    expect(a).toEqual(b);
  });

  it("differs for different seeds", () => {
    const a = bytes(valueNoiseTexture(64, 1, 2));
    const b = bytes(valueNoiseTexture(64, 2, 2));
    expect(a).not.toEqual(b);
  });

  it("clamps octave count into [1,3]", () => {
    const one = bytes(valueNoiseTexture(32, 7, 1));
    const three = bytes(valueNoiseTexture(32, 7, 3));
    const nine = bytes(valueNoiseTexture(32, 7, 9));
    expect(bytes(valueNoiseTexture(32, 7, 3))).toEqual(three);
    expect(nine).toEqual(three);
    expect(one).not.toEqual(three);
  });

  it("writes opaque pixels", () => {
    const id = valueNoiseTexture(16, 3, 1);
    for (let i = 3; i < id.data.length; i += 4) expect(id.data[i]).toBe(255);
  });
});

describe("cellularNoiseTexture", () => {
  it("is deterministic for a fixed seed and density", () => {
    const a = bytes(cellularNoiseTexture(128, 9, 1));
    const b = bytes(cellularNoiseTexture(128, 9, 1));
    expect(a).toEqual(b);
  });

  it("caps the feature-point count at 24 (load-bearing)", () => {
    const low = bytes(cellularNoiseTexture(64, 5, 0));
    const mid = bytes(cellularNoiseTexture(64, 5, 1));
    const high = bytes(cellularNoiseTexture(64, 5, 3));
    const huge = bytes(cellularNoiseTexture(64, 5, 100));
    expect(huge).toEqual(high);
    expect(mid).not.toEqual(low);
  });

  it("writes opaque pixels", () => {
    const id = cellularNoiseTexture(16, 1, 1);
    for (let i = 3; i < id.data.length; i += 4) expect(id.data[i]).toBe(255);
  });

  it("spans the full brightness range (maxDist scales with K, not the full diagonal)", () => {
    const id = cellularNoiseTexture(128, 9, 1);
    const r = id.data;
    let min = 255;
    let max = 0;
    for (let i = 0; i < r.length; i += 4) {
      if (r[i] < min) min = r[i];
      if (r[i] > max) max = r[i];
    }
    // Old constant `size*sqrt(2)` packed values into ~150-255; corrected formula
    // should yield pixels near 0 (cells far from any feature point).
    expect(min).toBeLessThan(60);
    expect(max).toBeGreaterThan(220);
  });
});
