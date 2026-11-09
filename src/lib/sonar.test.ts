// Accessibility core, step 6: the sonar's target and ping on a synthetic grid with a known answer.
import { describe, expect, test } from "bun:test";
import type { ValueGrid } from "@/lib/describe/stats";
import { arrived, closeness, FAR_MS, mapDistance, NEAR_MS, pingIntervalMs, sonarTarget } from "./sonar";

/** A 1° grid whose value peaks at (25.5, 95.5) and falls off with distance; ocean-like no data north of 40°. */
const grid: ValueGrid = {
  width: 360,
  height: 180,
  value: (i) => {
    const lat = 89.5 - Math.floor(i / 360);
    const lon = -179.5 + (i % 360);
    return lat > 40 ? null : 30 - Math.hypot(lat - 25.5, lon - 95.5) / 10;
  },
};

describe("sonar", () => {
  test("the target is the highest cell near the needle, at its centre", () => {
    expect(sonarTarget(grid, { lat: 21.5, lon: 89.8 })).toEqual({ value: 30, lat: 25.5, lon: 95.5 });
  });

  test("only the neighbourhood counts: far from the peak, the target is the best cell inside the square", () => {
    const t = sonarTarget(grid, { lat: -30, lon: 0 }, 10)!;
    expect(Math.abs(t.lat - -25.5)).toBeLessThan(1);
    expect(Math.abs(t.lon - 4.5)).toBeLessThan(1);
  });

  test("no data or nothing above zero: no target", () => {
    expect(sonarTarget({ width: 360, height: 180, value: () => null }, { lat: 0, lon: 0 })).toBeNull();
    expect(sonarTarget({ width: 360, height: 180, value: () => 0 }, { lat: 0, lon: 0 })).toBeNull();
  });

  test("the ping speeds up as the needle nears the target; arriving is within half a step or cell", () => {
    const target = { lat: 25.5, lon: 95.5 };
    expect(closeness(target, target)).toBe(1);
    expect(pingIntervalMs(closeness(target, target))).toBe(NEAR_MS);
    expect(pingIntervalMs(0)).toBe(FAR_MS);
    const far = closeness({ lat: 15, lon: 85 }, target);
    const near = closeness({ lat: 24, lon: 94 }, target);
    expect(near).toBeGreaterThan(far);
    expect(pingIntervalMs(near)).toBeLessThan(pingIntervalMs(far));
    expect(arrived({ lat: 25.7, lon: 95.2 }, target, 1, 1)).toBe(true);
    expect(arrived({ lat: 27, lon: 95.5 }, target, 1, 1)).toBe(false);
    expect(mapDistance({ lat: 0, lon: 179 }, { lat: 0, lon: -179 })).toBeCloseTo(2, 10);
  });
});
