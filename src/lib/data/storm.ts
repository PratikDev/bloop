// "The cursor follows the heaviest nearby cell" (plan C4): one point per frame.

import type { SweepPoint } from "@/lib/audio-adapter/types";
import { rowLat } from "./grid";
import { STORM_REGION, STORM_STEP_DEG, SWEEP_CENTER, type LatLon } from "./places";
import { decodeSequenceCode, type Sequence, type SequenceFrame } from "./sequence";

const colLon = (width: number, col: number) => ((col + 0.5) / width) * 360 - 180;
const rowOf = (height: number, lat: number) => Math.min(height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * height)));
const colOf = (width: number, lon: number) => Math.min(width - 1, Math.max(0, Math.floor(((lon + 180) / 360) * width)));

/** The wettest cell in a lat/lon box; ties go to the cell nearest `near`. */
function wettest(seq: Sequence, frame: SequenceFrame, box: { latMin: number; latMax: number; lonMin: number; lonMax: number }, near: LatLon) {
  const { width, height } = seq.size;
  let best: { lat: number; lon: number; mm: number; dist: number } | null = null;
  for (let row = rowOf(height, box.latMax); row <= rowOf(height, box.latMin); row++) {
    for (let col = colOf(width, box.lonMin); col <= colOf(width, box.lonMax); col++) {
      const { mmPerHour } = decodeSequenceCode(frame.codes[row * width + col]);
      if (mmPerHour === null || mmPerHour <= 0) continue;
      const lat = rowLat(seq.size, row);
      const lon = colLon(width, col);
      const dist = (lat - near.lat) ** 2 + (lon - near.lon) ** 2;
      if (!best || mmPerHour > best.mm || (mmPerHour === best.mm && dist < best.dist)) best = { lat, lon, mm: mmPerHour, dist };
    }
  }
  return best;
}

/** Index of the heaviest rain or snow along a path; -1 if every point is no data. */
export function peakIndex(points: SweepPoint[]): number {
  let peak = -1;
  points.forEach((p, i) => {
    if (p.mmPerHour !== null && (peak === -1 || p.mmPerHour > (points[peak].mmPerHour ?? 0))) peak = i;
  });
  return peak;
}

/** First index of a `size`-frame window centred on `center`, shifted inward to stay within `total` frames. */
export function windowStart(center: number, size: number, total: number): number {
  return Math.min(Math.max(0, center - Math.floor(size / 2)), Math.max(0, total - size));
}

/**
 * Starts at the heaviest rain over Bangladesh and the northern Bay (ties:
 * nearest Chattogram), then in each frame moves to the heaviest cell within
 * STORM_STEP_DEG of the previous position, never leaving that region. Stays
 * put if the area is dry.
 */
export function followStorm(seq: Sequence): SweepPoint[] {
  let at: LatLon = SWEEP_CENTER;
  return seq.frames.map((frame, i) => {
    // The search stays inside the region, so the cursor never wanders away from Bangladesh and the Bay.
    const box =
      i === 0
        ? STORM_REGION
        : {
            latMin: Math.max(STORM_REGION.latMin, at.lat - STORM_STEP_DEG),
            latMax: Math.min(STORM_REGION.latMax, at.lat + STORM_STEP_DEG),
            lonMin: Math.max(STORM_REGION.lonMin, at.lon - STORM_STEP_DEG),
            lonMax: Math.min(STORM_REGION.lonMax, at.lon + STORM_STEP_DEG),
          };
    const found = wettest(seq, frame, box, at);
    if (found) at = { lat: found.lat, lon: found.lon };
    const v = decodeSequenceCode(frame.codes[rowOf(seq.size.height, at.lat) * seq.size.width + colOf(seq.size.width, at.lon)]);
    return { lat: at.lat, lon: at.lon, valueC: null, mmPerHour: v.mmPerHour, phase: v.phase };
  });
}
