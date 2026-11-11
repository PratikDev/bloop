import type { LatLon } from "@/lib/data";
import { cellIndex, clampLat, wrapLon } from "@/lib/data/grid";
import { cellCentre, SPAN_DEG, type Extreme, type ValueGrid } from "@/lib/describe/stats";

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

export const sonarTarget = (g: ValueGrid, at: LatLon, spanDeg: number = SPAN_DEG): Extreme | null => extremeNear(g, at, "highest", spanDeg);

function mapDistance(a: LatLon, b: LatLon): number {
  const dLon = Math.abs(wrapLon(a.lon - b.lon));
  return Math.hypot(a.lat - b.lat, dLon);
}

export function closeness(at: LatLon, target: LatLon, spanDeg: number = SPAN_DEG): number {
  const far = Math.hypot(spanDeg / 2, spanDeg / 2);
  return Math.max(0, 1 - mapDistance(at, target) / far);
}

const FAR_MS = 1200;
const NEAR_MS = 150;
export const pingIntervalMs = (c: number) => Math.round(FAR_MS - (FAR_MS - NEAR_MS) * Math.min(1, Math.max(0, c)));

export function arrived(at: LatLon, target: LatLon, stepDeg: number, cellDeg: number): boolean {
  return mapDistance(at, target) <= Math.max(stepDeg, cellDeg) / 2;
}
