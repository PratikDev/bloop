import { describe, expect, test } from "bun:test";
import { createNoDataTracker } from "./nodata";

describe("no-data tracker", () => {
  test("ticks only on entering no data", () => {
    const t = createNoDataTracker(0.3);
    expect(t.update("ocean", false, 0)).toEqual({ entering: false, tick: false });
    expect(t.update("ocean", true, 1)).toEqual({ entering: true, tick: true });
    expect(t.update("ocean", true, 2)).toEqual({ entering: false, tick: false }); // still in no data
    expect(t.update("ocean", false, 3).entering).toBe(false);
    expect(t.update("ocean", true, 4).tick).toBe(true);
  });

  test("the first value after start or reset counts as entering", () => {
    const t = createNoDataTracker(0.3);
    expect(t.update("rain", true, 0).entering).toBe(true);
    t.reset();
    expect(t.update("rain", true, 5).entering).toBe(true);
  });

  test("ticks are at least minGapSec apart, shared across tracks", () => {
    const t = createNoDataTracker(0.3);
    expect(t.update("ocean", true, 1).tick).toBe(true);
    expect(t.update("rain", true, 1.1)).toEqual({ entering: true, tick: false });
    t.update("ocean", false, 1.2);
    expect(t.update("ocean", true, 1.35).tick).toBe(true);
  });
});
