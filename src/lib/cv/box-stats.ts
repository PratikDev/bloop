// PURE: what the jukebox read in a box of one frame: n cells, % no data, P10/P50/P90 and a 16-bin histogram, from a
// grid the app already decoded (no new data files). The same numbers as pipeline/tests/test_box_stats.py (which is
// the CV/ML gate's c1_boxstats.py promoted to a test). Percentiles use the engine's own helper (mapping-maths.ts).
import { percentile } from "@/lib/audio/mapping-maths";
import type { ValueGrid } from "@/lib/describe/stats";
import type { Bounds } from "./boxes";

/** Global equirectangular bounds (the live grids). */
export const GLOBAL_BOUNDS: Bounds = [-180, -90, 180, 90];
const HIST_BINS = 16;

/** A decoded grid with its own bounds (row 0 = north edge, column 0 = west edge). */
export interface BoxGrid extends ValueGrid {
  bounds: Bounds;
}

/** The fixed histogram axis of a record: its rule's or layer's own range, log10 when the record is log. */
export interface HistAxis {
  min: number;
  max: number;
  log: boolean;
}

export interface BoxStats {
  /** Cells whose centre is in the box. */
  n: number;
  /** Cells with a value. */
  valid: number;
  /** 0..100; null when the box holds no cell. */
  nodataPct: number | null;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  hist: number[] | null;
  /** The valid values, ascending, and the cell index of each value before sorting (for the chord's groups). */
  values: Float64Array;
  cells: Int32Array;
}

const inLon = (lon: number, w: number, e: number) => (w <= e ? lon >= w && lon <= e : lon >= w || lon <= e);

/** Every cell whose centre lies in the box (edges included), row by row. */
export function cellsInBox(grid: BoxGrid, box: Bounds): number[] {
  const [gw, gs, ge, gn] = grid.bounds;
  const [w, s, e, n] = box;
  const dLat = (gn - gs) / grid.height;
  const dLon = (ge - gw) / grid.width;
  const cols: number[] = [];
  for (let c = 0; c < grid.width; c++) if (inLon(gw + (c + 0.5) * dLon, w, e)) cols.push(c);
  const out: number[] = [];
  for (let r = 0; r < grid.height; r++) {
    const lat = gn - (r + 0.5) * dLat;
    if (lat < s || lat > n) continue;
    for (const c of cols) out.push(r * grid.width + c);
  }
  return out;
}

/** The histogram over the record's fixed axis (values clipped into it; log axes in log10, values under min at min). */
export function histogram(values: ArrayLike<number>, axis: HistAxis, bins: number = HIST_BINS): number[] {
  const lo = axis.log ? Math.log10(axis.min) : axis.min;
  const hi = axis.log ? Math.log10(axis.max) : axis.max;
  const out = new Array<number>(bins).fill(0);
  for (let i = 0; i < values.length; i++) {
    const x = axis.log ? Math.log10(Math.max(values[i], axis.min)) : values[i];
    const t = (Math.min(hi, Math.max(lo, x)) - lo) / (hi - lo);
    out[Math.min(bins - 1, Math.floor(t * bins))]++;
  }
  return out;
}

/** The box's statistics; a box with no valid cell has null percentiles and histogram. */
export function boxStats(grid: BoxGrid, box: Bounds, axis: HistAxis): BoxStats {
  const inBox = cellsInBox(grid, box);
  const pairs: [number, number][] = [];
  for (const i of inBox) {
    const v = grid.value(i);
    if (v !== null && Number.isFinite(v)) pairs.push([v, i]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  const values = Float64Array.from(pairs, (p) => p[0]);
  const cells = Int32Array.from(pairs, (p) => p[1]);
  const n = inBox.length;
  const nodataPct = n ? 100 * (1 - values.length / n) : null;
  if (!values.length) return { n, valid: 0, nodataPct, p10: null, p50: null, p90: null, hist: null, values, cells };
  return { n, valid: values.length, nodataPct, p10: percentile(values, 10), p50: percentile(values, 50), p90: percentile(values, 90), hist: histogram(values, axis), values, cells };
}
