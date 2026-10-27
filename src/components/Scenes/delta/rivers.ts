// Which drawn river is under the needle (for the chip and the pluck earcon).
// Visual only: no river value exists in this pack (SWOT heights come later).

import type { LatLon } from "@/lib/data";
import type { DeltaRiver } from "./delta-scene";

/** Within this many degrees of a river line, the needle is "on" it. */
const ON_RIVER_DEG = 0.06;

function segmentDistance(p: LatLon, a: [number, number], b: [number, number], kx: number): number {
  const ax = a[0] * kx;
  const bx = b[0] * kx;
  const px = p.lon * kx;
  const dx = bx - ax;
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (p.lat - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), p.lat - (a[1] + t * dy));
}

export function nearestRiver(at: LatLon, rivers: readonly DeltaRiver[]): string | null {
  const kx = Math.cos((at.lat * Math.PI) / 180);
  for (const r of rivers) {
    for (const path of r.paths) {
      for (let i = 1; i < path.length; i++) if (segmentDistance(at, path[i - 1], path[i], kx) < ON_RIVER_DEG) return r.name;
    }
  }
  return null;
}
