import { beforeEach, describe, expect, it } from "vitest";
import { init } from "../src/core/orchestrator";
import { registry } from "../src/effects/registry";

function makeHost(attrs: string, style = ""): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-folex", attrs);
  if (style) el.setAttribute("style", style);
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("init — parsing & binding", () => {
  it("binds a known effect and marks the host bound", () => {
    const el = makeHost("glow");
    init();
    expect(el.hasAttribute("data-folex-bound")).toBe(true);
    expect(el.style.boxShadow).toBeTruthy();
  });

  it("binds multiple effects on one host", () => {
    const el = makeHost("glow ripple");
    init();
    expect(el.style.boxShadow).toBeTruthy();
    expect(el.querySelectorAll(".fx-ripple").length).toBeGreaterThan(0);
  });

  it("skips unknown effect names silently without throwing", () => {
    const el = makeHost("glow banana nonexistent");
    expect(() => init()).not.toThrow();
    expect(el.style.boxShadow).toBeTruthy();
    expect(el.hasAttribute("data-folex-bound")).toBe(true);
  });

  it("does not rebind on a second scan", () => {
    const el = makeHost("glow");
    init();
    const first = el.querySelectorAll(".fx-layer").length;
    init();
    expect(el.querySelectorAll(".fx-layer").length).toBe(first);
  });

  it("sets the host position to relative when it was static", () => {
    const el = makeHost("glow");
    init();
    expect(el.style.position).toBe("relative");
  });

  it("respects an existing non-static position", () => {
    const el = makeHost("glow", "position: absolute");
    init();
    expect(el.style.position).toBe("absolute");
  });
});

describe("init — ripple self-clip wrapper", () => {
  it("wraps ripple layers inside a .fx-ripple-clip element", () => {
    const el = makeHost("ripple", "--fx-layers: 2");
    init();
    const clip = el.querySelector(".fx-ripple-clip");
    expect(clip).not.toBeNull();
    expect(clip?.querySelectorAll(".fx-ripple").length).toBe(2);
  });

  it("keeps glow as box-shadow on host, not inside ripple clip", () => {
    const el = makeHost("glow ripple");
    init();
    const clip = el.querySelector(".fx-ripple-clip");
    expect(clip?.querySelector(".fx-glow")).toBeNull();
    expect(el.style.boxShadow).toBeTruthy();
  });

  it("does not touch the host overflow; ripple self-clips via its wrapper class", () => {
    const el = makeHost("glow ripple");
    el.style.overflow = "";
    init();
    expect(el.style.overflow).toBe("");
    expect(el.querySelector(".fx-ripple-clip")).not.toBeNull();
  });
});

describe("init — scoping & watch", () => {
  it("scopes to a root when given", () => {
    const outside = makeHost("glow");
    const root = document.createElement("section");
    const inside = document.createElement("div");
    inside.setAttribute("data-folex", "glow");
    root.appendChild(inside);
    document.body.appendChild(root);
    init({ root });
    expect(outside.style.boxShadow).toBeFalsy();
    expect(inside.style.boxShadow).toBeTruthy();
  });

  it("binds elements added after init when watch is true", async () => {
    init({ watch: true });
    const el = document.createElement("div");
    el.setAttribute("data-folex", "glow");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.style.boxShadow).toBeTruthy();
    expect(el.hasAttribute("data-folex-bound")).toBe(true);
  });
});

describe("init — hostile inputs at once (playground parity)", () => {
  it("binds glow+ripple+pixie with every value clamped, never throws", () => {
    const el = document.createElement("div");
    el.setAttribute("data-folex", "glow ripple pixie");
    el.setAttribute(
      "style",
      "--fx-layers: 999; --fx-color: not-a-color; --fx-speed: -50; --fx-field: nonsense;",
    );
    el.style.width = "120px";
    el.style.height = "120px";
    el.style.background = "#3a7bff";
    document.body.appendChild(el);

    expect(() => init()).not.toThrow();
    expect(el.hasAttribute("data-folex-bound")).toBe(true);
    expect(el.style.boxShadow).toBeTruthy();
    // 999 layers clamp to 12 — the documented validator bound
    expect(el.querySelectorAll(".fx-ripple").length).toBe(12);
  });
});

describe("init — --fx-blend applies to ripple", () => {
  it("applies the configured blend mode on every ripple layer", () => {
    const el = makeHost("ripple", "--fx-layers: 3; --fx-blend: overlay");
    init();
    const layers = el.querySelectorAll(".fx-ripple");
    expect(layers.length).toBe(3);
    layers.forEach((l) => {
      expect((l as HTMLElement).style.mixBlendMode).toBe("overlay");
    });
  });

  it("falls back to overlay for unknown --fx-blend values on ripple", () => {
    const el = makeHost("ripple", "--fx-blend: nonsense-mode");
    init();
    expect((el.querySelector(".fx-ripple") as HTMLElement).style.mixBlendMode).toBe("overlay");
  });
});

describe("init — ripple hover-flexible animation duration", () => {
  it("sets --fx-dur as CSS custom property on every layer, not animation-duration inline", () => {
    const el = makeHost("ripple", "--fx-layers: 2; --fx-speed: 1");
    init();
    const layers = el.querySelectorAll(".fx-ripple") as NodeListOf<HTMLElement>;
    expect(layers.length).toBe(2);
    layers.forEach((l) => {
      expect(l.style.animationDuration).toBe("");
      const dur = l.style.getPropertyValue("--fx-dur");
      expect(dur).toMatch(/^\d+\.\d{2}s$/);
    });
  });

  it("scales --fx-dur with --fx-speed (higher speed = shorter duration)", () => {
    const slow = makeHost("ripple", "--fx-layers: 1; --fx-speed: 0.5");
    init();
    const fast = makeHost("ripple", "--fx-layers: 1; --fx-speed: 4");
    init();
    const slowDur = parseFloat(
      (slow.querySelector(".fx-ripple") as HTMLElement).style.getPropertyValue("--fx-dur"),
    );
    const fastDur = parseFloat(
      (fast.querySelector(".fx-ripple") as HTMLElement).style.getPropertyValue("--fx-dur"),
    );
    expect(fastDur).toBeLessThan(slowDur);
  });
});

describe("init — ripple opacity normalization preserves noise variance", () => {
  function opacityFor(layers: number, intensity: number): number {
    return Math.max(0.03, intensity / Math.sqrt(layers));
  }

  it("per-layer opacity is lower when there are more layers (1/√N decay)", () => {
    const one = makeHost("ripple", "--fx-layers: 1; --fx-intensity: 0.6");
    const six = makeHost("ripple", "--fx-layers: 6; --fx-intensity: 0.6");
    init();
    const oneOp = parseFloat((one.querySelector(".fx-ripple") as HTMLElement).style.opacity);
    const sixOp = parseFloat((six.querySelector(".fx-ripple") as HTMLElement).style.opacity);
    expect(sixOp).toBeLessThan(oneOp);
    expect(sixOp).toBeCloseTo(opacityFor(6, 0.6), 5);
  });

  it("op = I/√N preserves variance: o²·N is constant across layer counts", () => {
    // Var[result] ≈ o²·N·σ². If we want constant variance as N grows, o²·N must be constant.
    const cases = [1, 2, 3, 6, 8, 12];
    const samples = cases.map((N) => {
      const el = makeHost("ripple", `--fx-layers: ${N}; --fx-intensity: 0.6`);
      init();
      const op = parseFloat((el.querySelector(".fx-ripple") as HTMLElement).style.opacity);
      return op * op * N;
    });
    // All values should be approximately equal (≈ intensity² = 0.36)
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeCloseTo(samples[0], 1);
    }
    expect(samples[0]).toBeCloseTo(0.36, 2);
  });

  it("at 12 layers, per-layer opacity is still high enough to be individually visible", () => {
    const el = makeHost("ripple", "--fx-layers: 12; --fx-intensity: 0.6");
    init();
    const op = parseFloat((el.querySelector(".fx-ripple") as HTMLElement).style.opacity);
    // I/√12 = 0.6/3.464 ≈ 0.173 — more than 2x the old formula's 0.074
    expect(op).toBeGreaterThan(0.15);
    expect(op).toBeLessThan(0.2);
  });

  it("respects the 0.03 floor for absurdly high layer counts or low intensity", () => {
    const el = makeHost("ripple", "--fx-layers: 12; --fx-intensity: 0.05");
    init();
    const op = parseFloat((el.querySelector(".fx-ripple") as HTMLElement).style.opacity);
    expect(op).toBe(0.03);
  });
});

describe("init — --fx-blend defaults to overlay (preserves noise contrast)", () => {
  it("applies overlay as the default mix-blend-mode on ripple layers", () => {
    const el = makeHost("ripple");
    init();
    expect((el.querySelector(".fx-ripple") as HTMLElement).style.mixBlendMode).toBe("overlay");
  });
});

describe("registry", () => {
  it("maps the M1 effect names to setup functions", () => {
    expect(typeof registry.glow).toBe("function");
    expect(typeof registry.ripple).toBe("function");
    expect(typeof registry.pixie).toBe("function");
  });

  it("returns undefined for unknown names (skipped silently)", () => {
    expect(registry.distort).toBeUndefined();
  });
});

describe("init — glow box-shadow on host", () => {
  it("sets a box-shadow on the host using the glow color", () => {
    const el = makeHost("glow", "--fx-color: #ffb37c");
    init();
    expect(el.style.boxShadow).toContain("#ffb37c");
  });

  it("preserves the host's existing box-shadow by prepending the glow shadow", () => {
    const el = makeHost("glow", "box-shadow: 0 2px 8px rgba(0,0,0,0.5)");
    init();
    const shadow = el.style.boxShadow;
    expect(shadow).toContain("0 2px 8px rgba(0,0,0,0.5)");
    expect(shadow.split(",").length).toBeGreaterThanOrEqual(2);
  });

  it("sets only the glow shadow when the host has no existing box-shadow", () => {
    const el = makeHost("glow", "--fx-intensity: 1");
    init();
    expect(el.style.boxShadow).toMatch(/^0 0 5px 1px /);
    expect(el.style.boxShadow.split(",").length).toBe(2);
  });
});
