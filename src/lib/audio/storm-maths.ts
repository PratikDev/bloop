// PURE: storm time-lapse helpers.

import type { SweepPoint } from "./types";

/**
 * Index of the frame with the heaviest rain or snow (first one on a tie), or
 * -1 when no frame has any (all dry or no data). Same rule as L3's
 * peakIndex() in lib/data/storm.ts, except that an all-dry storm has no peak.
 */
export function peakFrame(frames: readonly SweepPoint[]): number {
  let peak = -1;
  frames.forEach((f, i) => {
    if (f.mmPerHour !== null && f.mmPerHour > 0 && (peak === -1 || f.mmPerHour > (frames[peak].mmPerHour ?? 0))) peak = i;
  });
  return peak;
}
