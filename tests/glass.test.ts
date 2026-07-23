import { describe, expect, it } from "vitest";
import type { ResolvedVars } from "../src/core/derive";
import { setup } from "../src/effects/glass";

function mockVars(overrides?: Partial<ResolvedVars>): ResolvedVars {
  return {
    color: "#7c3aed",
    radius: "12px",
    intensity: 0.6,
    speed: 1,
    scale: 1,
    density: 1.25,
    layers: 1,
    field: "turbulence",
    blend: "overlay",
    distort: 0,
    blur: 12,
    tint: 0.15,
    bounds: "normal",
    glassBlur: 12,
    glassSaturate: 180,
    glassChroma: 0.3,
    glassSpectrumSpeed: 1,
    ...overrides,
  };
}

describe("glass effect", () => {
  it("creates fx-glass-clip with four child layers and sets stacking context", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars());
    const clip = host.querySelector(".fx-glass-clip");
    expect(clip).toBeTruthy();
    expect(clip?.children).toHaveLength(4);
    expect(host.style.zIndex).toBe("0");
    // Verify it was appended (last child)
    expect(host.lastElementChild).toBe(clip);
    document.body.removeChild(host);
  });

  it("all layers use fx-layer base class", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars());
    const layers = host.querySelectorAll(".fx-glass-clip .fx-layer");
    expect(layers).toHaveLength(3);
    document.body.removeChild(host);
  });

  it("sets frost blur and saturate variables on clip", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars({ glassBlur: 16, glassSaturate: 200 }));
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    expect(clip.style.getPropertyValue("--fx-glass-frost-blur")).toBe("16px");
    expect(clip.style.getPropertyValue("--fx-glass-frost-sat")).toBe("200%");
    document.body.removeChild(host);
  });

  it("sets frost inner shadow variable with color-mix", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars({ color: "#ff0000", tint: 0.25 }));
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    const frostShadow = clip.style.getPropertyValue("--fx-glass-frost-shadow");
    expect(frostShadow).toContain("color-mix");
    expect(frostShadow).toContain("#ff0000");
    expect(frostShadow).toContain("25%");
    document.body.removeChild(host);
  });

  it("sets spectrum linear-gradient via CSS variable", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars());
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    expect(clip.style.getPropertyValue("--fx-glass-spectrum-bg")).toContain("linear-gradient");
    document.body.removeChild(host);
  });

  it("spectrum speed affects animation duration variable (with random variance)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars({ glassSpectrumSpeed: 2 }));
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    const durStr = clip.style.getPropertyValue("--fx-glass-spectrum-dur");
    const dur = parseFloat(durStr);
    // Base is 4s, variance is ±20% (3.2s to 4.8s)
    expect(dur).toBeGreaterThanOrEqual(3.2);
    expect(dur).toBeLessThanOrEqual(4.8);
    expect(durStr).toContain("s");
    document.body.removeChild(host);
  });

  it("sets spectrum opacity variable based on intensity", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars({ intensity: 0.5 }));
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    expect(clip.style.getPropertyValue("--fx-glass-spectrum-op")).toBe("0.2"); // 0.5 * 0.4 = 0.2
    document.body.removeChild(host);
  });

  it("sets chroma opacity variable based on intensity and glassChroma", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars({ intensity: 0.8, glassChroma: 0.5 }));
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    expect(Number.parseFloat(clip.style.getPropertyValue("--fx-glass-chroma-op"))).toBeCloseTo(0.4);
    document.body.removeChild(host);
  });

  it("correct layer order inside clip", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    setup(host, mockVars());
    const clip = host.querySelector(".fx-glass-clip") as HTMLElement;
    const children = [...clip.children] as HTMLElement[];
    expect(children[0].classList.contains("fx-glass-prism")).toBe(true);
    expect(children[1].classList.contains("fx-glass-spectrum")).toBe(true);
    expect(children[2].classList.contains("fx-glass-chroma")).toBe(true);
    expect(children[3].classList.contains("fx-glass-highlight")).toBe(true);
    document.body.removeChild(host);
  });
});
