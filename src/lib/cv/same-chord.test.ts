// The card's numbers are the T2 output file's.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { INVARIANCE, largestSpread } from "./same-chord";

const file = JSON.parse(readFileSync(new URL("../../../public/data/meta/colormap_invariance.json", import.meta.url), "utf8")) as typeof INVARIANCE;

describe("same chord card", () => {
  test("reads the T2 file as written", () => {
    expect(INVARIANCE).toEqual(file);
    expect(file.generated_by).toBe("pipeline/tests/test_colormap_invariance.py");
  });

  test("the largest spreads are the file's, under the measured error", () => {
    const s = largestSpread();
    expect(s.median).toBe(Math.max(...file.cases.map((c) => c.clean.median_spread_C)));
    expect(s.mode).toBe(Math.max(...file.cases.flatMap((c) => c.clean.mode_spread_C ?? [])));
    expect(s.median).toBeLessThanOrEqual(s.sigma);
    expect(s.mode).toBeLessThanOrEqual(s.sigma);
  });
});
