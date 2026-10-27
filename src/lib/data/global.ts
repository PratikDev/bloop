// The global history cube (contract §14): three monthly records on their own
// grids. Loaded only when a view needs them (~10–15 MB). Window means here use
// the definition places.json states in `basis` (the mean of the months present
// in the window); they reproduce places.json's numbers exactly.

import type {
  GlobalConfidenceFile,
  GlobalLayerFile,
  GlobalLayerName,
  GlobalManifest,
  GlobalPlacesFile,
} from "@/types/data-contract";
import { fetchBuffer, fetchJson, gunzip } from "./fetch";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

export const CUBE_NO_DATA = -32768;

export interface GlobalLayer {
  meta: GlobalLayerFile;
  /** [row][month] row-major, as stored; value = int16 / scale. */
  values: Int16Array;
  /** cell_id → row in `values` (−1 = no row: the layer has no data there). */
  rowOf: Int32Array;
}

/** "YYYY-MM" → months since 0000-01 (for differences). */
export const monthNumber = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

export async function loadGlobalLayer(name: GlobalLayerName): Promise<GlobalLayer> {
  const url = DATA_PATHS.global(`${name}.json`);
  const meta = await fetchJson<GlobalLayerFile>(url);
  requirePaths(url, meta, { scale: "number", month_start: "string", n_months: "number", "grid.lat": "array", "grid.lon": "array", cells: "array", file: "string" });
  const buffer = await gunzip(await fetchBuffer(DATA_PATHS.global(meta.file)));
  const values = new Int16Array(buffer);
  if (values.length !== meta.cells.length * meta.n_months) {
    throw new Error(`${meta.file}: ${values.length} values; expected ${meta.cells.length} cells × ${meta.n_months} months`);
  }
  const rowOf = new Int32Array(meta.grid.lat.length * meta.grid.lon.length).fill(-1);
  meta.cells.forEach((id, row) => {
    rowOf[id] = row;
  });
  return { meta, values, rowOf };
}

export const loadGlobalPlaces = () => fetchJson<GlobalPlacesFile>(DATA_PATHS.global("places.json"));
export const loadGlobalConfidence = () => fetchJson<GlobalConfidenceFile>(DATA_PATHS.global("confidence.json"));
export const loadGlobalManifest = () => fetchJson<GlobalManifest>(DATA_PATHS.global("manifest.json"));

/** The cell whose centre is nearest (lat, lon): cell_id = row × n_lon + col (row 0 = north). */
export function cellIdAt(meta: GlobalLayerFile, lat: number, lon: number): number {
  const { lat: lats, lon: lons } = meta.grid;
  const dLat = lats[0] - lats[1];
  const dLon = lons[1] - lons[0];
  const row = Math.min(lats.length - 1, Math.max(0, Math.round((lats[0] - lat) / dLat)));
  const wrapped = ((((lon - lons[0] + dLon / 2) % 360) + 360) % 360) - dLon / 2;
  const col = Math.min(lons.length - 1, Math.max(0, Math.round(wrapped / dLon)));
  return row * lons.length + col;
}

/** The centre of a cell. */
export function cellCentre(meta: GlobalLayerFile, id: number): { lat: number; lon: number } {
  const n = meta.grid.lon.length;
  return { lat: meta.grid.lat[Math.floor(id / n)], lon: meta.grid.lon[id % n] };
}

/** One month's value (null = no data or outside the record). */
export function cubeValue(layer: GlobalLayer, row: number, month: number): number | null {
  if (row < 0 || month < 0 || month >= layer.meta.n_months) return null;
  const v = layer.values[row * layer.meta.n_months + month];
  return v === CUBE_NO_DATA ? null : v / layer.meta.scale;
}

/** Index of a "YYYY-MM" month in the layer (may be outside 0..n_months − 1). */
export const monthIndexOf = (layer: GlobalLayer, ym: string) => monthNumber(ym) - monthNumber(layer.meta.month_start);

/** Mean of the months present in [from, to] (inclusive, "YYYY-MM"); null if none are. */
export function windowMean(layer: GlobalLayer, row: number, from: string, to: string): number | null {
  let sum = 0;
  let n = 0;
  for (let m = monthIndexOf(layer, from); m <= monthIndexOf(layer, to); m++) {
    const v = cubeValue(layer, row, m);
    if (v === null) continue;
    sum += v;
    n++;
  }
  return n === 0 ? null : sum / n;
}

/** The months in [from, to] and their values (null = missing). */
export function monthlyRun(layer: GlobalLayer, row: number, from: string, to: string): { months: string[]; values: (number | null)[] } {
  const months: string[] = [];
  const values: (number | null)[] = [];
  for (let k = monthNumber(from); k <= monthNumber(to); k++) {
    const ym = `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
    months.push(ym);
    values.push(cubeValue(layer, row, monthIndexOf(layer, ym)));
  }
  return { months, values };
}
