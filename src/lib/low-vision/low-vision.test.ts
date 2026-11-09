import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import type { ValueGrid } from "@/lib/describe/stats";
import { bandIndex, bandLabels, oceanBands, rainBands, valueRange } from "./bands";
import { contrast, NON_TEXT, TEXT_AAA } from "./contrast";
import { bandVars, labelOn, resolveVars } from "./scales";
import { applyPreset, LV_DEFAULTS, LV_PRESET, nextLensSize, parseLowVision, recoloured } from "./settings";

const CSS = readFileSync(path.resolve(import.meta.dir, "../../app/globals.css"), "utf8");

/** A theme's tokens from globals.css (the block for `selector`). */
function tokens(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`, selector === ":root" ? CSS.indexOf("Low-vision mode (accessibility core") : 0);
  const body = CSS.slice(start, CSS.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

describe("low-vision settings", () => {
  test("saved settings keep only allowed values", () => {
    const lv = parseLowVision({ theme: "hcLight", textScale: 175, bands: 7, customText: "#00ff00", customBackground: "red", lens: "yes", calm: true });
    expect(lv.theme).toBe("hcLight");
    expect(lv.textScale).toBe(LV_DEFAULTS.textScale);
    expect(lv.bands).toBe(7);
    expect(lv.customText).toBe("#00ff00");
    expect(lv.customBackground).toBe(LV_DEFAULTS.customBackground);
    expect(lv.lens).toBe(false);
    expect(lv.calm).toBe(true);
    expect(parseLowVision(null)).toEqual(LV_DEFAULTS);
  });

  test("the preset turns on its settings and off again gives back the defaults; the rest is kept", () => {
    const mine = { ...LV_DEFAULTS, font: "atkinson" as const };
    const on = applyPreset(mine, true);
    expect(on).toMatchObject({ ...LV_PRESET, on: true, font: "atkinson" });
    expect(recoloured(on)).toBe(true);
    expect(applyPreset(on, false)).toEqual({ ...mine, on: false });
  });

  test("[ and ] step the lens size and stop at the ends", () => {
    expect(nextLensSize(320, 1)).toBe(420);
    expect(nextLensSize(240, -1)).toBe(240);
    expect(nextLensSize(560, 1)).toBe(560);
  });
});

const grid = (w: number, h: number, f: (r: number, c: number) => number | null): ValueGrid => ({ width: w, height: h, value: (i) => f(Math.floor(i / w), i % w) });

describe("value bands", () => {
  test("ocean bands are whole degrees from the coldest water and cover the warmest", () => {
    const b = oceanBands({ min: -1.8, max: 31.6 }, 5);
    expect(b[0].lo).toBe(-2);
    expect(b.every((x, i) => i === 0 || x.lo === b[i - 1].hi)).toBe(true);
    expect(b[4].hi! > 31.6).toBe(true);
    expect(b.map((x) => x.hi! - x.lo)).toEqual([7, 7, 7, 7, 7]);
  });

  test("rain bands: dry is no band, the top band is open-ended", () => {
    const b = rainBands(5);
    expect(bandIndex(b, "rain", 0)).toBe(-1);
    expect(bandIndex(b, "rain", null)).toBe(-1);
    expect(bandIndex(b, "rain", 0.3)).toBe(0);
    expect(bandIndex(b, "rain", 50)).toBe(4);
    expect(b[4].hi).toBeNull();
  });

  test("labels sit where one band fills the tile, on a cell whose value is in it", () => {
    // Left half 10 °C, right half 25 °C, a land strip (null) in the middle column.
    const g = grid(40, 20, (_, c) => (c === 20 ? null : c < 20 ? 10 : 25));
    const bands = oceanBands(valueRange(g)!, 5);
    const labels = bandLabels(g, bands, "ocean", 4, 2);
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(bandIndex(bands, "ocean", g.value(l.cell))).toBe(l.band);
    expect(new Set(labels.map((l) => l.band)).size).toBe(2);
  });

  test("the lens's labels: only inside the region it magnifies, which is clipped to the grid", () => {
    const g = grid(40, 20, (_, c) => (c < 20 ? 10 : 25));
    const bands = oceanBands(valueRange(g)!, 5);
    const inside = bandLabels(g, bands, "ocean", 3, 2, { c0: 22, r0: 4, c1: 34, r1: 16 });
    expect(inside.length).toBeGreaterThan(0);
    for (const l of inside) {
      const [r, c] = [Math.floor(l.cell / g.width), l.cell % g.width];
      expect(c).toBeGreaterThanOrEqual(22);
      expect(c).toBeLessThan(34);
      expect(r).toBeGreaterThanOrEqual(4);
      expect(r).toBeLessThan(16);
      expect(bandIndex(bands, "ocean", g.value(l.cell))).toBe(l.band);
    }
    // Past the grid's edge (a lens near the date line or a pole): only real cells.
    for (const l of bandLabels(g, bands, "ocean", 3, 2, { c0: 30, r0: -5, c1: 50, r1: 6 })) expect(l.cell).toBeLessThan(g.width * g.height);
    expect(bandLabels(g, bands, "ocean", 3, 2, { c0: 45, r0: 0, c1: 60, r1: 10 })).toEqual([]);
  });
});

describe("contrast and colours", () => {
  test("WCAG contrast: black on white is 21:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  for (const theme of ["hcDark", "hcLight"]) {
    test(`${theme}: text at least 7:1 on every surface; focus and needle at least 3:1`, () => {
      const c = tokens(`:root[data-lv-theme="${theme}"]`);
      for (const text of ["moon", "haze", "tt-text", "tt-muted"]) for (const bg of ["night", "dusk", "tide", "tt-panel"]) expect(contrast(c[text], c[bg])).toBeGreaterThanOrEqual(TEXT_AAA);
      for (const bg of ["night", "dusk", "tide"]) expect(contrast(c.shapla, c[bg])).toBeGreaterThanOrEqual(NON_TEXT);
      // The needle: a shapla ring with an ink outline on both sides.
      expect(contrast(c.shapla, c.ink)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }

  test("band colours: two-tone alternates; scales spread their ten stops; labels pick the readable ink", () => {
    expect(bandVars("twoTone", 4)).toEqual(["--lv-two-b", "--lv-two-a", "--lv-two-b", "--lv-two-a"]);
    expect(bandVars("luminance", 2)).toEqual(["--lv-lum-0", "--lv-lum-9"]);
    expect(bandVars("cividis", 10)[9]).toBe("--lv-cividis-9");
    const root = tokens(":root");
    expect(resolveVars(bandVars("cividis", 2), (v) => root[v.slice(2)])).toEqual(["#00224e", "#fee838"]);
    expect(labelOn("#ffff00")).toBe("#000000");
    expect(labelOn("#000000")).toBe("#ffffff");
  });
});
