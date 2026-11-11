import type { LatLon } from "@/lib/data";
import { clampLat, wrapLon } from "@/lib/data/grid";
import { SPAN_DEG } from "@/lib/describe/stats";
import file from "./boxes.json";
import { percentile } from "@/lib/audio/mapping-maths";
import type { ValueGrid } from "@/lib/describe/stats";

export type Bounds = readonly [number, number, number, number];

export interface NamedBox {
  id: string;
  name: string;
  bounds: Bounds;
}

export const NAMED_BOXES: readonly NamedBox[] = file.boxes.map((b) => ({ id: b.id, name: b.name, bounds: [b.bounds[0], b.bounds[1], b.bounds[2], b.bounds[3]] }));

export const NEEDLE_BOX = "needle";
export const BOX_IDS: readonly string[] = [NEEDLE_BOX, ...NAMED_BOXES.map((b) => b.id)];

function needleBounds(at: LatLon, spanDeg: number = SPAN_DEG): Bounds {
  const h = spanDeg / 2;
  return [wrapLon(at.lon - h), clampLat(at.lat - h), wrapLon(at.lon + h), clampLat(at.lat + h)];
}

export function boundsOf(id: string, at: LatLon): Bounds {
  return NAMED_BOXES.find((b) => b.id === id)?.bounds ?? needleBounds(at);
}

export const GLOBAL_BOUNDS: Bounds = [-180, -90, 180, 90];
const HIST_BINS = 16;

export interface BoxGrid extends ValueGrid {
  bounds: Bounds;
}

export interface HistAxis {
  min: number;
  max: number;
  log: boolean;
}

export interface BoxStats {
  n: number;
  valid: number;
  nodataPct: number | null;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  hist: number[] | null;
  values: Float64Array;
  cells: Int32Array;
}

const inLon = (lon: number, w: number, e: number) => (w <= e ? lon >= w && lon <= e : lon >= w || lon <= e);

function cellsInBox(grid: BoxGrid, box: Bounds): number[] {
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
