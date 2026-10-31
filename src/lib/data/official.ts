// Official Challenge #14 records (contract §15 official.ts): the record list, a record's manifest and validation,
// and its layers. A layer loads chunk by chunk (each chunk = consecutive time steps); valueAt() reads the cell
// whose area contains (lat, lon) at one time step. null = no data → honest silence; below = under the colorbar's
// range (the value is then the layer's below_range_bound, an upper limit).

import type { OfficialIndex, OfficialLayer, OfficialManifest, OfficialValidationFile } from "@/types/data-contract";
import { fetchBuffer, fetchJson, gunzip } from "./fetch";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

export const OFFICIAL_NODATA = 65535;
export const OFFICIAL_BELOW = 65534;

export interface OfficialReading {
  value: number;
  /** true: censored, the real value is under `value` (the layer's below_range_bound). */
  below: boolean;
}

/** Related records (named rel_…) live in public/data/related/, the official ones in public/data/official/. */
const RELATED_PREFIX = "rel_";
const recordPath = (record: string, file: string) =>
  (record.startsWith(RELATED_PREFIX) ? DATA_PATHS.related : DATA_PATHS.official)(`${record}/${file}`);

export const loadOfficialIndex = () => fetchJson<OfficialIndex>(DATA_PATHS.official("index.json"));
export const loadRelatedIndex = () => fetchJson<OfficialIndex>(DATA_PATHS.related("index.json"));

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
