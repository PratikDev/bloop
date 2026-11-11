// Facts the layered descriptions are built from: the range of a frame with where its
// extremes are, the warmest latitude band, and how a value is spread in the 3×3 cells around the needle. Every number
// here is computed from the decoded grid; the templates only place them into sentences.
import type { LatLon } from "@/lib/data";
import { cellIndex, clampLat, wrapLon } from "@/lib/data/grid";
import { REGION_NAMES, type RegionName } from "@/a11y/mapNav";

/** A decoded equirectangular grid (row 0 = 90° N, column 0 = 180° W); `value` is null for no data (land, gaps). */
export interface ValueGrid {
  width: number;
  height: number;
  value(index: number): number | null;
}

export interface Extreme extends LatLon {
  value: number;
}

/** The centre of a cell. */
export function cellCentre(g: Pick<ValueGrid, "width" | "height">, index: number): LatLon {
  const row = Math.floor(index / g.width);
  const col = index % g.width;
  return { lat: 90 - (row + 0.5) * (180 / g.height), lon: -180 + (col + 0.5) * (360 / g.width) };
}

/** The lowest and highest values in the grid, with their cells' centres (the first cell, scanning from the north-west). */
export function extremes(g: ValueGrid): { min: Extreme; max: Extreme } | null {
  let lo = -1;
  let hi = -1;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < g.width * g.height; i++) {
    const v = g.value(i);
    if (v === null) continue;
    if (v < min) [min, lo] = [v, i];
    if (v > max) [max, hi] = [v, i];
  }
  if (lo === -1) return null;
  return { min: { value: min, ...cellCentre(g, lo) }, max: { value: max, ...cellCentre(g, hi) } };
}

/** Latitude bands for the warmest-band rule, in degrees (design choice). */
export const BAND_DEG = 5;
/** "Near the equator": a band whose centre is within this many degrees of it (±15°). */
export const EQUATOR_DEG = 15;

/** The centre latitude of the band with the highest mean value, or null when no band has data. */
export function peakBand(g: ValueGrid, bandDeg: number = BAND_DEG): number | null {
  const bands = Math.round(180 / bandDeg);
  const sum = new Float64Array(bands);
  const count = new Uint32Array(bands);
  for (let i = 0; i < g.width * g.height; i++) {
    const v = g.value(i);
    if (v === null) continue;
    const b = Math.min(bands - 1, Math.floor((Math.floor(i / g.width) / g.height) * bands));
    sum[b] += v;
    count[b]++;
  }
  let best = -1;
  for (let b = 0; b < bands; b++) if (count[b] > 0 && (best === -1 || sum[b] / count[b] > sum[best] / count[best])) best = b;
  return best === -1 ? null : 90 - (best + 0.5) * bandDeg;
}

/** The 3×3 neighbourhood around the needle: SPAN_DEG across, so each cell is a third of it (design choice). */
export const SPAN_DEG = 30;

/** Mean value in each of the nine cells around `at` (REGION_NAMES order: south-west … north-east); null = no data. */
export function around(g: ValueGrid, at: LatLon, spanDeg: number = SPAN_DEG): (number | null)[] {
  const step = spanDeg / 3;
  // Sample on the grid's own spacing, so every source cell inside counts once.
  const dLat = 180 / g.height;
  const dLon = 360 / g.width;
  return REGION_NAMES.map((_, n) => {
    const row = Math.floor(n / 3) - 1; // −1 = south
    const col = (n % 3) - 1; // −1 = west
    const south = at.lat + (row - 0.5) * step;
    const west = at.lon + (col - 0.5) * step;
    let sum = 0;
    let count = 0;
    for (let lat = south + dLat / 2; lat < south + step; lat += dLat) {
      if (lat < -90 || lat > 90) continue;
      for (let lon = west + dLon / 2; lon < west + step; lon += dLon) {
        const v = g.value(cellIndex(g, clampLat(lat), wrapLon(lon)));
        if (v === null) continue;
        sum += v;
        count++;
      }
    }
    return count === 0 ? null : sum / count;
  });
}

/** Under this spread between the nine means, the ocean around the needle counts as even (°C; design choice). */
export const EVEN_C = 0.5;
/** A cell with at least this share of the nine cells' rain counts as where the rain is concentrated (design choice). */
export const CONCENTRATED_SHARE = 0.4;

export type LocalPattern = { kind: "even" } | { kind: "toward"; region: RegionName } | { kind: "spread" } | { kind: "none" };

/** Ocean: the warmest of the nine cells, unless they are all within EVEN_C of each other. */
export function warmestAround(means: (number | null)[]): LocalPattern {
  const known = means.filter((m) => m !== null);
  if (known.length < 2) return { kind: "none" };
  if (Math.max(...known) - Math.min(...known) < EVEN_C) return { kind: "even" };
  return { kind: "toward", region: REGION_NAMES[maxIndex(means)] };
}

/**
 * Rain: dry all round ("even"), concentrated in one cell, or spread. A cell whose mean is under `floor` (the rain rule's
 * lowest input, where the sound is silent too) counts as dry, so the words and the sound agree.
 */
export function rainAround(raw: (number | null)[], floor = 0): LocalPattern {
  const means = raw.map((m) => (m !== null && m < floor ? 0 : m));
  const known = means.filter((m) => m !== null);
  if (known.length === 0) return { kind: "none" };
  const total = known.reduce((a, b) => a + b, 0);
  if (total === 0) return { kind: "even" };
  const top = maxIndex(means);
  return (means[top] ?? 0) / total >= CONCENTRATED_SHARE ? { kind: "toward", region: REGION_NAMES[top] } : { kind: "spread" };
}

function maxIndex(means: (number | null)[]): number {
  let best = -1;
  means.forEach((m, i) => {
    if (m !== null && (best === -1 || m > (means[best] ?? -Infinity))) best = i;
  });
  return best;
}
