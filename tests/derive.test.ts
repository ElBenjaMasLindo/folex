import { beforeAll, describe, expect, it } from "vitest";
import { resolveVars } from "../src/core/derive";

function makeHost(style = ""): HTMLElement {
  const el = document.createElement("div");
  if (style) el.setAttribute("style", style);
  document.body.appendChild(el);
  return el;
}

beforeAll(() => {
  // happy-dom's default getComputedStyle for color/background is empty;
  // most tests set explicit values. The safeColor patch from setup.ts makes
  // explicit --fx-color validation faithful.
});

describe("resolveVars — validation table defaults", () => {
  it("returns every documented default on a bare host", () => {
    const el = makeHost();
    const v = resolveVars(el);
    expect(v.intensity).toBe(0.6);
    expect(v.speed).toBe(1);
    expect(v.scale).toBe(1);
    expect(v.density).toBe(1.25);
    expect(v.layers).toBe(1);
    expect(v.field).toBe("turbulence");
    expect(v.distort).toBe(0);
    expect(v.blur).toBe(12);
    expect(v.tint).toBe(0.15);
    expect(v.bounds).toBe("normal");
    el.remove();
  });

  it("rounds layers to an integer", () => {
    const el = makeHost("--fx-layers: 3.7");
    expect(resolveVars(el).layers).toBe(4);
    el.remove();
  });

  it("clamps out-of-range numbers", () => {
    const el = makeHost("--fx-speed: -50; --fx-blur: 999; --fx-tint: 5");
    const v = resolveVars(el);
    expect(v.speed).toBe(0.1);
    expect(v.blur).toBe(40);
    expect(v.tint).toBe(1);
    el.remove();
  });

  it("falls back on garbage values", () => {
    const el = makeHost("--fx-layers: abc; --fx-density: ; --fx-field: nonsense");
    const v = resolveVars(el);
    expect(v.layers).toBe(1);
    expect(v.density).toBe(1.25);
    expect(v.field).toBe("turbulence");
    el.remove();
  });

  it("accepts a valid enum value", () => {
    const el = makeHost("--fx-field: cellular");
    expect(resolveVars(el).field).toBe("cellular");
    el.remove();
  });
});

describe("resolveVars — pixie bounds", () => {
  it("defaults to normal", () => {
    const el = makeHost();
    expect(resolveVars(el).bounds).toBe("normal");
    el.remove();
  });

  it.each([
    "loose",
    "normal",
    "tight",
    "strict",
  ] as const)("accepts %s as a valid --fx-pixie-bounds value", (level) => {
    const el = makeHost(`--fx-pixie-bounds: ${level}`);
    expect(resolveVars(el).bounds).toBe(level);
    el.remove();
  });

  it("falls back to normal on garbage values", () => {
    const el = makeHost("--fx-pixie-bounds: bananas");
    expect(resolveVars(el).bounds).toBe("normal");
    el.remove();
  });
});

describe("resolveVars — color fallback chain", () => {
  it("uses explicit --fx-color when valid", () => {
    const el = makeHost("--fx-color: #3a7bff");
    expect(resolveVars(el).color).toBe("#3a7bff");
    el.remove();
  });

  it("rejects an invalid --fx-color (not-a-color)", () => {
    const el = makeHost("--fx-color: not-a-color");
    const v = resolveVars(el);
    // falls through the chain; happy-dom computed color/backgroundColor are
    // empty, so the warm default is used
    expect(v.color).toBe("#ffb37c");
    el.remove();
  });

  it("rejects a url() payload as --fx-color", () => {
    const el = makeHost("--fx-color: url(evil.com/track.gif)");
    expect(resolveVars(el).color).toBe("#ffb37c");
    el.remove();
  });

  it("skips a transparent --fx-color", () => {
    const el = makeHost("--fx-color: transparent");
    expect(resolveVars(el).color).toBe("#ffb37c");
    el.remove();
  });

  it("derives from computed color when --fx-color is unset", () => {
    const el = makeHost("color: #7cf");
    expect(resolveVars(el).color).toBe("#7cf");
    el.remove();
  });

  it("derives from background-color when color is transparent", () => {
    const el = makeHost("color: transparent; background-color: #113");
    expect(resolveVars(el).color).toBe("#113");
    el.remove();
  });

  it("uses the warm default when nothing is usable", () => {
    const el = makeHost();
    expect(resolveVars(el).color).toBe("#ffb37c");
    el.remove();
  });
});

describe("resolveVars — radius", () => {
  it("mirrors the host's computed border-radius", () => {
    const el = makeHost("border-radius: 18px");
    expect(resolveVars(el).radius).toBe("18px");
    el.remove();
  });
});
