import { describe, expect, it } from "vitest";
import { enumMatch, numberInRange, safeColor } from "../src/core/validate";

describe("numberInRange", () => {
  const v = numberInRange(0, 1);

  it("clamps above max", () => {
    expect(v("5", 0.6)).toBe(1);
  });
  it("clamps below min", () => {
    expect(v("-0.5", 0.6)).toBe(0);
  });
  it("accepts in-range", () => {
    expect(v("0.42", 0.6)).toBe(0.42);
  });
  it("returns fallback on null", () => {
    expect(v(null, 0.6)).toBe(0.6);
  });
  it("returns fallback on empty string", () => {
    expect(v("", 0.6)).toBe(0.6);
  });
  it("returns fallback on non-numeric garbage", () => {
    expect(v("banana", 0.6)).toBe(0.6);
  });
  it("returns fallback on NaN literal", () => {
    expect(v("NaN", 0.6)).toBe(0.6);
  });
  it("returns fallback on Infinity", () => {
    expect(v("Infinity", 0.6)).toBe(0.6);
  });
  it("returns fallback on -Infinity", () => {
    expect(v("-Infinity", 0.6)).toBe(0.6);
  });
  it("parses scientific notation", () => {
    expect(v("1e-1", 0.6)).toBe(0.1);
  });
});

describe("enumMatch", () => {
  const v = enumMatch(["turbulence", "cellular"] as const);

  it("accepts a valid member", () => {
    expect(v("turbulence", "turbulence")).toBe("turbulence");
  });
  it("accepts the other member", () => {
    expect(v("cellular", "turbulence")).toBe("cellular");
  });
  it("trims surrounding whitespace", () => {
    expect(v("  turbulence  ", "turbulence")).toBe("turbulence");
  });
  it("returns fallback on unknown value", () => {
    expect(v("nonsense", "turbulence")).toBe("turbulence");
  });
  it("returns fallback on banana", () => {
    expect(v("banana", "turbulence")).toBe("turbulence");
  });
  it("returns fallback on null", () => {
    expect(v(null, "turbulence")).toBe("turbulence");
  });
  it("returns fallback on empty string", () => {
    expect(v("", "turbulence")).toBe("turbulence");
  });
  it("returns fallback on injection attempt", () => {
    expect(v("turbulence;}</style><script>", "turbulence")).toBe("turbulence");
  });
});

describe("safeColor", () => {
  const fallback = "#ffb37c";

  it("accepts a named color", () => {
    expect(safeColor("red", fallback)).toBe("red");
  });
  it("accepts a hex color", () => {
    expect(safeColor("#3a7bff", fallback)).toBe("#3a7bff");
  });
  it("accepts rgba()", () => {
    expect(safeColor("rgba(10,20,30,0.5)", fallback)).toBe("rgba(10,20,30,0.5)");
  });
  it("rejects 'not-a-color'", () => {
    expect(safeColor("not-a-color", fallback)).toBe(fallback);
  });
  it("rejects 'banana'", () => {
    expect(safeColor("banana", fallback)).toBe(fallback);
  });
  it("rejects a CSS injection payload", () => {
    expect(safeColor("red; }</style>", fallback)).toBe(fallback);
  });
  it("rejects a url() resource", () => {
    expect(safeColor("url(evil.com)", fallback)).toBe(fallback);
  });
  it("returns fallback on null", () => {
    expect(safeColor(null, fallback)).toBe(fallback);
  });
  it("returns fallback on empty string", () => {
    expect(safeColor("", fallback)).toBe(fallback);
  });
  it("trims whitespace before checking", () => {
    expect(safeColor("  #fff  ", fallback)).toBe("#fff");
  });
});
