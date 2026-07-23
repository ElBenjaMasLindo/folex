import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readPreloadMargin } from "../src/particles/engine";

describe("readPreloadMargin", () => {
  const original = document.documentElement.style.getPropertyValue("--fx-pixie-preload");

  beforeEach(() => {
    document.documentElement.style.removeProperty("--fx-pixie-preload");
  });

  afterEach(() => {
    if (original) {
      document.documentElement.style.setProperty("--fx-pixie-preload", original);
    } else {
      document.documentElement.style.removeProperty("--fx-pixie-preload");
    }
  });

  it("returns fallback when the variable is unset", () => {
    expect(readPreloadMargin()).toBe(200);
  });

  it("parses a bare number", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "350");
    expect(readPreloadMargin()).toBe(350);
  });

  it("parses a px value", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "150px");
    expect(readPreloadMargin()).toBe(150);
  });

  it("parses a decimal value", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "12.5px");
    expect(readPreloadMargin()).toBe(12.5);
  });

  it("treats 0 as a valid preloading-off signal", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "0px");
    expect(readPreloadMargin()).toBe(0);
  });

  it("rejects negative values and falls back", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "-50px");
    expect(readPreloadMargin()).toBe(200);
  });

  it("rejects non-numeric values and falls back", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "banana");
    expect(readPreloadMargin()).toBe(200);
  });

  it("rejects shorthand (engine only consumes a single length)", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "100px 50px");
    expect(readPreloadMargin()).toBe(200);
  });

  it("rejects empty string after trim and falls back", () => {
    document.documentElement.style.setProperty("--fx-pixie-preload", "   ");
    expect(readPreloadMargin()).toBe(200);
  });
});
