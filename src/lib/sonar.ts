// Sonar: the warmest (ocean) or wettest (rain) spot near the needle, from the decoded frame. Used by the N key
// (ExploreControls/use-sonar.ts) and Ask Bloop's "highest/lowest near" answers (AskBloop/questions.ts).
import type { LatLon } from "@/lib/data";
import { cellIndex, clampLat, wrapLon } from "@/lib/data/grid";
import { cellCentre, SPAN_DEG, type Extreme, type ValueGrid } from "@/lib/describe/stats";

/**
 * The highest (the sonar's target: positive values only) or lowest value within `spanDeg` (a square centred on `at`),
 * at its cell's centre; null when there is none. The lowest is Ask Bloop's "coldest spot near here".
 */
export function extremeNear(g: ValueGrid, at: LatLon, kind: "highest" | "lowest", spanDeg: number = SPAN_DEG): Extreme | null {
  const half = spanDeg / 2;
  const dLat = 180 / g.height;
  const dLon = 360 / g.width;
  const better = kind === "highest" ? (v: number, b: number) => v > b : (v: number, b: number) => v < b;
  let best: Extreme | null = null;
  for (let lat = at.lat - half + dLat / 2; lat < at.lat + half; lat += dLat) {
    if (lat < -90 || lat > 90) continue;
    for (let lon = at.lon - half + dLon / 2; lon < at.lon + half; lon += dLon) {
      const i = cellIndex(g, clampLat(lat), wrapLon(lon));
      const v = g.value(i);
      if (v !== null && (kind === "lowest" || v > 0) && (best === null || better(v, best.value))) best = { value: v, ...cellCentre(g, i) };
    }
  }
  return best;
}

/** The highest value within `spanDeg` (a square centred on `at`), at its cell's centre; null when there is none. */
export const sonarTarget = (g: ValueGrid, at: LatLon, spanDeg: number = SPAN_DEG): Extreme | null => extremeNear(g, at, "highest", spanDeg);

/** Degrees between two points on the map (lon wrapped the short way). */
function mapDistance(a: LatLon, b: LatLon): number {
  const dLon = Math.abs(wrapLon(a.lon - b.lon));
  return Math.hypot(a.lat - b.lat, dLon);
}

/** How near the needle is: 1 at the target, 0 at the edge of the search square's corner or beyond. */
export function closeness(at: LatLon, target: LatLon, spanDeg: number = SPAN_DEG): number {
  const far = Math.hypot(spanDeg / 2, spanDeg / 2);
  return Math.max(0, 1 - mapDistance(at, target) / far);
}

/** The ping's timing (design choice): from FAR_MS between pings when far to NEAR_MS at the target. */
const FAR_MS = 1200;
const NEAR_MS = 150;
export const pingIntervalMs = (c: number) => Math.round(FAR_MS - (FAR_MS - NEAR_MS) * Math.min(1, Math.max(0, c)));

/** Arrived: the needle is in the target's cell, or within one arrow step of it. */
export function arrived(at: LatLon, target: LatLon, stepDeg: number, cellDeg: number): boolean {
  return mapDistance(at, target) <= Math.max(stepDeg, cellDeg) / 2;
}
