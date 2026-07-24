import { describe, expect, it } from "vitest";
import { resolveVars } from "../src/core/derive";
import { setup as tiltSetup } from "../src/effects/tilt";

describe("tilt effect", () => {
  it("initializes preserve-3d transformStyle on host element", () => {
    const host = document.createElement("div");
    const vars = resolveVars(host);

    tiltSetup(host, vars);

    expect(host.style.transformStyle).toBe("preserve-3d");
  });
});
