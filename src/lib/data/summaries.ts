// Whole-frame summaries and paths that feed the sound engine (L2 BUILD_PLAN §13).

import type { SweepPoint } from "@/lib/audio-adapter/types";
import { clampLat, rowLat, wrapLon } from "./grid";
import { decodeSst, type SstField } from "./latest";
import { MOTIF_BANDS, OPENING_PATH, SWEEP_RINGS, type LatLon } from "./places";
import { valueAt, type LiveFields } from "./value-at";

/** Both tracks at one point, in the engine's input shape. */
export function pointAt(fields: LiveFields, lat: number, lon: number): SweepPoint {
  const rain = valueAt(fields, "rain", lat, lon);
  return {
    lat,
    lon,
    valueC: valueAt(fields, "ocean", lat, lon).valueC,
    mmPerHour: rain.mmPerHour,
    phase: rain.phase,
  };
}

/**
 * Area-weighted (cos latitude) mean ocean temperature of each motif band.
 * null = the band has no ocean data (the motif plays a rest).
 */
export function bandMeans(sst: SstField): (number | null)[] {
  const { width, height } = sst.meta.grid;
  return MOTIF_BANDS.map(([south, north]) => {
    let sum = 0;
    let weight = 0;
    for (let row = 0; row < height; row++) {
      const lat = rowLat(sst.meta.grid, row);
      if (lat < south || lat >= north) continue;
      const w = Math.cos((lat * Math.PI) / 180);
      for (let col = 0; col < width; col++) {
        const v = decodeSst(sst.meta, sst.codes[row * width + col]);
        if (v === null) continue;
        sum += v * w;
        weight += w;
      }
    }
    return weight > 0 ? sum / weight : null;
  });
}

/** Rings outward from `center`; each point knows which ring it is on. */
export function sweepPath(
  fields: LiveFields,
  center: LatLon,
): { points: SweepPoint[]; ring: number[]; ringDeg: number[] } {
  const points: SweepPoint[] = [];
  const ring: number[] = [];
  const ringDeg: number[] = [];
  const { stepDeg, maxDeg, pointsPerRing } = SWEEP_RINGS;
  for (let r = stepDeg, k = 0; r <= maxDeg; r += stepDeg, k++) {
    ringDeg.push(r);
    for (let i = 0; i < pointsPerRing; i++) {
      const angle = (i / pointsPerRing) * 2 * Math.PI;
      const lat = clampLat(center.lat + r * Math.sin(angle));
      // Stretch longitude so rings stay round on the globe, not on the map.
      const lonScale = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
      points.push(pointAt(fields, lat, wrapLon(center.lon + (r * Math.cos(angle)) / lonScale)));
      ring.push(k);
    }
  }
  return { points, ring, ringDeg };
}

export function openingPath(fields: LiveFields): SweepPoint[] {
  const { from, to, points } = OPENING_PATH;
  return Array.from({ length: points }, (_, i) => {
    const t = points === 1 ? 0 : i / (points - 1);
    return pointAt(fields, from.lat + (to.lat - from.lat) * t, from.lon + (to.lon - from.lon) * t);
  });
}
