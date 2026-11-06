import type { SweepPoint } from "@/lib/audio";

/**
 * SYNTHETIC storm for the harness only (made-up numbers): 48 frames rising
 * from dry to 40 mm/h and back, 3 frames of snow in the middle, 2 no-data
 * frames (BUILD_PLAN §9.2).
 */
const N = 48;
const FROZEN = new Set([23, 24, 25]);
const NO_DATA = new Set([10, 37]);
const PEAK_MM = 40;
const LIGHTEST_MM = 0.1;

export function syntheticStorm(): SweepPoint[] {
  return Array.from({ length: N }, (_, i) => {
    const t = 1 - Math.abs(i - (N - 1) / 2) / ((N - 1) / 2); // 0 at the ends, 1 in the middle
    const base = { lat: 21.5, lon: 90 };
    if (NO_DATA.has(i)) return { ...base, valueC: null, mmPerHour: null, phase: "nodata" };
    if (t < 0.08) return { ...base, valueC: null, mmPerHour: 0, phase: "dry" };
    const mm = LIGHTEST_MM * Math.pow(PEAK_MM / LIGHTEST_MM, t); // even steps on the log scale
    return { ...base, valueC: null, mmPerHour: mm, phase: FROZEN.has(i) ? "frozen" : "liquid" };
  });
}
