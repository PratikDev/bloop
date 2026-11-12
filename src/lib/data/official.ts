// Official Challenge #14 records (contract §15 official.ts): the record list, a record's manifest and validation,
// and its layers. A layer loads chunk by chunk (each chunk = consecutive time steps); valueAt() reads the cell
// whose area contains (lat, lon) at one time step. null = no data → honest silence; below = under the colorbar's
// range (the value is then the layer's below_range_bound, an upper limit).

import type { OfficialIndex, OfficialLayer, OfficialManifest, OfficialValidationFile } from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { gunzip } from "./gunzip";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";
import { withAppRecords } from "@/lib/earth/records";

export const OFFICIAL_NODATA = 65535;
export const OFFICIAL_BELOW = 65534;
/** Significant figures an Official value is shown with (the record page, its transcript). */
export const OFFICIAL_DIGITS = 3;

/** A "pattern only" value is never shown as a number: only where it sits in the layer's own range, in five levels. */
export const PATTERN_LEVELS = ["veryLow", "low", "middle", "high", "veryHigh"] as const;
export type PatternLevel = (typeof PATTERN_LEVELS)[number];
export const PATTERN_ONLY = "pattern only";

export function patternLevel(layer: OfficialLayer, value: number): PatternLevel {
  const [lo, hi] = layer.value_range ?? [value, value];
  const f = layer.encoding === "log10" && lo > 0 && value > 0 ? (x: number) => Math.log10(x) : (x: number) => x;
  const share = f(hi) > f(lo) ? (f(value) - f(lo)) / (f(hi) - f(lo)) : 0.5;
  return PATTERN_LEVELS[Math.min(PATTERN_LEVELS.length - 1, Math.max(0, Math.floor(share * PATTERN_LEVELS.length)))];
}

export interface OfficialReading {
  value: number;
  /** true: censored, the real value is under `value` (the layer's below_range_bound). */
  below: boolean;
}

/** Related records (named rel_…) live in public/data/related/, the official ones in public/data/official/. */
const RELATED_PREFIX = "rel_";
const recordPath = (record: string, file: string) =>
  (record.startsWith(RELATED_PREFIX) ? DATA_PATHS.related : DATA_PATHS.official)(`${record}/${file}`);

// The records built from the shipped products (src/lib/earth/records.ts) join after the pipeline's rows.
export const loadOfficialIndex = () => fetchJson<OfficialIndex>(DATA_PATHS.official("index.json")).then(withAppRecords);
/** Feature flag: NEXT_PUBLIC_SHOW_HIDDEN_RELATED=1 also lists the related records the pipeline marks `hidden` (too sparse
 *  to play: a needle reads "no value" as they play). Off by default. */
export const SHOW_HIDDEN_RELATED = process.env.NEXT_PUBLIC_SHOW_HIDDEN_RELATED === "1";

/** The related records the app lists: every row, or (by default) those not marked hidden. */
export const listedRelated = (index: OfficialIndex, showHidden = SHOW_HIDDEN_RELATED): OfficialIndex =>
  showHidden ? index : { records: index.records.filter((r) => !r.hidden) };

export const loadRelatedIndex = async () => listedRelated(await fetchJson<OfficialIndex>(DATA_PATHS.related("index.json")));

export async function loadOfficialManifest(record: string): Promise<OfficialManifest> {
  const url = recordPath(record, "manifest.json");
  const m = await fetchJson<OfficialManifest>(url);
  requirePaths(url, m, { record: "string", layers: "array", "period.label": "string", badge: "string", svs_ids: "array" });
  return m;
}

export const loadOfficialValidation = (record: string) =>
  fetchJson<OfficialValidationFile>(recordPath(record, "validation.json"));

export interface OfficialGrid {
  layer: OfficialLayer;
  /** One Uint16Array per time step, H×W, row 0 = north edge of the bounds. */
  steps: Uint16Array[];
}

export async function loadOfficialLayer(record: string, layer: OfficialLayer): Promise<OfficialGrid> {
  const { width, height } = layer.grid;
  const cell = width * height;
  const steps: Uint16Array[] = [];
  for (const chunk of layer.chunks) {
    const buffer = await gunzip(await fetchBuffer(recordPath(record, chunk.file)));
    const codes = new Uint16Array(buffer);
    const n = chunk.t1 - chunk.t0;
    if (codes.length !== n * cell) throw new Error(`${chunk.file}: ${codes.length} values; expected ${n} × ${width} × ${height}`);
    for (let i = 0; i < n; i++) steps.push(codes.subarray(i * cell, (i + 1) * cell));
  }
  if (steps.length !== layer.times.length) throw new Error(`${layer.id}: ${steps.length} steps; expected ${layer.times.length}`);
  return { layer, steps };
}

/** A stored code → its reading (encoding from the layer); null for no data. */
export function decodeCode(layer: OfficialLayer, code: number): OfficialReading | null {
  if (code === OFFICIAL_NODATA) return null;
  if (code === OFFICIAL_BELOW) return layer.below_range_bound === undefined ? null : { value: layer.below_range_bound, below: true };
  const x = code * layer.scale + layer.offset;
  return { value: layer.encoding === "log10" ? 10 ** x : x, below: false };
}

/** The reading at (lat, lon) and time step t; null outside the layer's bounds or where there is no data. */
export function officialValueAt(grid: OfficialGrid, t: number, lat: number, lon: number): OfficialReading | null {
  const { width, height, bounds } = grid.layer.grid;
  const [west, south, east, north] = bounds;
  if (lat < south || lat > north || lon < west || lon > east) return null;
  const col = Math.min(width - 1, Math.floor(((lon - west) / (east - west)) * width));
  const row = Math.min(height - 1, Math.floor(((north - lat) / (north - south)) * height));
  const step = grid.steps[Math.max(0, Math.min(grid.steps.length - 1, t))];
  return decodeCode(grid.layer, step[row * width + col]);
}
