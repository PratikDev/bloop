// Global history cube (contract §14, docs/L1/DATA_HANDOFF.md §8): monthly heat, rain and water on their own grids,
// for 42 named places and every cell. Optional and heavy (about 13 MB), so each layer loads only when a view first
// needs it, and is kept after that.
//   <layer>.i16.gz: gzip of int16 little-endian, [row][month] (row = cells index; cells[row] = cell_id);
//   value = int16 / scale; −32768 = no data → null (silence).
// Two ways in: by a place's row (Month by month: layerSeries) and by a cell on the grid (the scenes: cellIdAt, rowOf,
// windowMean, monthlyRun). Window means use the definition places.json states in `basis` (the mean of the months
// present in the window); they reproduce places.json's numbers exactly.

import type { GlobalConfidenceFile, GlobalLayerFile, GlobalLayerName, GlobalManifest, GlobalPlacesFile } from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { gunzip } from "./gunzip";
import { DATA_PATHS } from "./paths";
import { DataShapeError, requirePaths } from "./validate";

export const CUBE_NO_DATA = -32768;

export interface GlobalLayer {
  meta: GlobalLayerFile;
  months: string[]; // "YYYY-MM", one per column
  /** [row][month] row-major, as stored; value = int16 / scale. */
  values: Int16Array;
  /** cell_id → row in `values` (−1 = no row: the layer has no data there). */
  rowOf: Int32Array;
}

export const loadGlobalPlaces = async (): Promise<GlobalPlacesFile> => {
  const file = await fetchJson<GlobalPlacesFile>(DATA_PATHS.globalPlaces);
  requirePaths(DATA_PATHS.globalPlaces, file, { note: "string", demo_note: "string", places: "array" });
  return file;
};

export const loadGlobalManifest = async (): Promise<GlobalManifest> => {
  const file = await fetchJson<GlobalManifest>(DATA_PATHS.globalManifest);
  requirePaths(DATA_PATHS.globalManifest, file, { disclosure: "string" });
  return file;
};

export const loadGlobalConfidence = () => fetchJson<GlobalConfidenceFile>(DATA_PATHS.globalConfidence);

/** "YYYY-MM" → months since 0000-01 (for differences). */
export const monthNumber = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

/** `start` ("YYYY-MM") plus `count` consecutive months. */
function monthAxis(start: string, count: number): string[] {
  const m0 = monthNumber(start);
  return Array.from({ length: count }, (_, k) => `${Math.floor((m0 + k) / 12)}-${String(((m0 + k) % 12) + 1).padStart(2, "0")}`);
}

async function fetchLayer(name: GlobalLayerName): Promise<GlobalLayer> {
  const url = DATA_PATHS.globalLayer(name);
  const meta = await fetchJson<GlobalLayerFile>(url);
  requirePaths(url, meta, { file: "string", scale: "number", month_start: "string", n_months: "number", "grid.lat": "array", "grid.lon": "array", cells: "array", units: "string", dataset: "string" });
  const raw = await gunzip(await fetchBuffer(DATA_PATHS.globalFile(meta.file)));
  const expected = meta.cells.length * meta.n_months * 2;
  if (raw.byteLength !== expected) throw new DataShapeError(meta.file, `${raw.byteLength} bytes, expected ${expected}`);
  const rowOf = new Int32Array(meta.grid.lat.length * meta.grid.lon.length).fill(-1);
  meta.cells.forEach((id, row) => {
    rowOf[id] = row;
  });
  return { meta, months: monthAxis(meta.month_start, meta.n_months), values: new Int16Array(raw), rowOf };
}

const layers = new Map<GlobalLayerName, Promise<GlobalLayer>>();

/** Loads a layer once; a failed load is forgotten so it can be tried again. */
export function loadGlobalLayer(name: GlobalLayerName): Promise<GlobalLayer> {
  const cached = layers.get(name);
  if (cached) return cached;
  const loading = fetchLayer(name).catch((e: unknown) => {
    layers.delete(name);
    throw e;
  });
  layers.set(name, loading);
  return loading;
}

/** One place's monthly values: row `index` of the layer (GlobalCellRef.index). */
export function layerSeries(layer: GlobalLayer, index: number): (number | null)[] {
  return Array.from({ length: layer.meta.n_months }, (_, m) => cubeValue(layer, index, m));
}

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
