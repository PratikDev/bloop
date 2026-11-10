// Box statistics (A1) on small grids: which cells a box holds (edges, a box across 180°, a bounded grid), no data
// counted apart, numpy's percentile, the fixed-axis histogram; and the short line under the braille rules.
import { describe, expect, test } from "bun:test";
import { violations } from "@/a11y/brailleText";
import { needleBounds } from "./boxes";
import { boxStats, cellsInBox, histogram, type BoxGrid } from "./box-stats";
import { readShort } from "./read-short";
import type { ReadSource } from "./read-source";

/** A 36 × 18 global grid (10° cells) whose value is the column index; row 0 has no data. */
const grid: BoxGrid = { width: 36, height: 18, bounds: [-180, -90, 180, 90], value: (i) => (i < 36 ? null : i % 36) };

describe("box statistics", () => {
  test("cells whose centre is in the box, edges included", () => {
    // centres at 5, 15, 25 ... : a 0..20 by 0..20 box holds 2 × 2 cells
    expect(cellsInBox(grid, [0, 0, 20, 20]).length).toBe(4);
    expect(cellsInBox(grid, [5, 5, 15, 15]).length).toBe(4);
  });

  test("a box across 180° wraps", () => {
    const cells = cellsInBox(grid, [170, -10, -170, 10]);
    expect(cells.map((i) => i % 36).sort((a, b) => a - b)).toEqual([0, 0, 35, 35]);
    expect(needleBounds({ lat: 0, lon: 175 })[2]).toBeLessThan(0);
  });

  test("a bounded grid uses its own bounds", () => {
    const local: BoxGrid = { width: 10, height: 10, bounds: [80, 10, 90, 20], value: () => 1 };
    expect(cellsInBox(local, [80, 10, 85, 15]).length).toBe(25);
  });

  test("no data is counted apart; percentiles as numpy's default", () => {
    const s = boxStats(grid, [-180, 70, 180, 90], { min: 0, max: 36, log: false });
    expect(s.n).toBe(72);
    expect(s.valid).toBe(36);
    expect(s.nodataPct).toBe(50);
    expect(s.p50).toBe(17.5);
    expect(s.p10).toBeCloseTo(3.5, 10);
    expect(s.hist?.reduce((a, b) => a + b, 0)).toBe(36);
  });

  test("an empty box has no numbers", () => {
    const s = boxStats(grid, [-180, 80, 180, 90], { min: 0, max: 36, log: false });
    expect([s.valid, s.p50, s.hist]).toEqual([0, null, null]);
  });

  test("histogram: values clipped into the axis; log axes from the axis minimum", () => {
    expect(histogram([-5, 0, 36, 99], { min: 0, max: 36, log: false }, 4)).toEqual([2, 0, 0, 2]);
    expect(histogram([0, 0.1, 1, 10], { min: 0.1, max: 10, log: true }, 2)).toEqual([2, 2]);
  });
});

describe("short line", () => {
  const src = (trust: ReadSource["trust"]): ReadSource => ({
    recordId: "ocean", name: "Ocean temperature", unit: "°C", trust, status: "verified", axis: { min: 0, max: 36, log: false },
    pitchVoice: "ocean", timeUtc: null, timeLabel: null, grid,
  });
  const stats = boxStats(grid, [-180, -90, 180, 90], { min: 0, max: 36, log: false });

  test("front loaded, braille-safe, one 40-cell line", () => {
    const line = readShort(src("verified"), stats, null);
    expect(line).toBe("Read: SST med 17.5C P10-90 3.00-32.0");
    expect(violations(line, 40)).toEqual([]);
  });

  test("pattern only reads no numbers", () => {
    expect(readShort(src("pattern"), stats, null)).toBe("Read: SST pattern only");
  });
});
