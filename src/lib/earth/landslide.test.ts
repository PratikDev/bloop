// P3, landslide exposure: the app's decode equals the pipeline's (cells per class over the whole grid, which covers every
// sample cell); each class gives its own sound and the lowest ones are stated silences; the braille line passes the rules.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { violations } from "@/a11y/brailleText";
import { bindT } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import type { LandslideClassMetadata } from "@/types/data-contract";
import { classAt } from "./class-grid";
import { classesRule, classState, isSilent, LANDSLIDE_VOICE, ruleMatchesClasses } from "./classes";
import { cellsPerClass, slideBrailleLine, slideLine, type LandslideGrid } from "./landslide";

const meta = readData<LandslideClassMetadata>("latest/landslide_class.json");
const grid: LandslideGrid = { meta, codes: new Uint8Array(readFileSync("public/data/latest/landslide_class.bin")) };
const rule = classesRule(LANDSLIDE_VOICE);
const t = bindT("en");

describe("LHASA classes decode as the pipeline decoded them", () => {
  test("cells per class over the whole grid equal the pipeline's cells_per_class", () => {
    expect(cellsPerClass(grid)).toEqual(meta.cells_per_class);
  });
  test("five sample cells, one of each class, read back their class", () => {
    for (const c of meta.classes) {
      const i = grid.codes.indexOf(c.code);
      expect(i).toBeGreaterThanOrEqual(0);
      const r = Math.floor(i / meta.grid.width);
      const col = i % meta.grid.width;
      const lat = 90 - ((r + 0.5) / meta.grid.height) * 180;
      const lon = -180 + ((col + 0.5) / meta.grid.width) * 360;
      expect(classAt(grid, lat, lon), c.label).toBe(c.code);
    }
  });
});

describe("the rumble rule", () => {
  test("lists the product's classes with its labels", () => {
    expect(ruleMatchesClasses(rule, meta.classes)).toBe(true);
  });
  test("none shown and the lowest class are stated silences; each higher class is its own rumble, the highest pulsed", () => {
    expect(isSilent(classState(rule, 0))).toBe(true);
    expect(isSilent(classState(rule, 1))).toBe(true);
    const rumbles = meta.classes.slice(2).map((c) => classState(rule, c.code)?.rumble);
    for (const r of rumbles) expect(r).toBeDefined();
    expect(new Set(rumbles.map((r) => JSON.stringify(r))).size).toBe(rumbles.length);
    for (let i = 1; i < rumbles.length; i++) expect(rumbles[i]!.gain).toBeGreaterThan(rumbles[i - 1]!.gain);
    expect(rumbles.at(-1)!.pulsesPerSecond).toBeGreaterThan(0);
    expect(rumbles[0]!.pulsesPerSecond).toBe(0);
  });
  test("the words: a silence says why, a rumble says so; the label is always modelled exposure", () => {
    expect(slideLine(t, "en", meta, 0)).toContain("Silence:");
    expect(slideLine(t, "en", meta, 4)).toContain("slow pulses");
    for (const c of meta.classes) expect(violations(slideBrailleLine(meta, c.code), 40)).toEqual([]);
  });
});
