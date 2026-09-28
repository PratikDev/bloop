// Global history cube (contract §14, docs/L1/DATA_HANDOFF.md §8): monthly heat,
// rain and water for 42 named places. Optional and heavy (about 13 MB), so each
// layer loads only when a world place first needs it, and is kept after that.
//   <layer>.i16.gz: gzip of int16 little-endian, [row][month] (row = cells index);
//   value = int16 / scale; −32768 = no data → null (silence).

import type { GlobalLayerFile, GlobalLayerName, GlobalManifest, GlobalPlacesFile } from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { gunzip } from "./gunzip";
import { DATA_PATHS } from "./paths";
import { DataShapeError, requirePaths } from "./validate";

const NO_DATA = -32768;

export interface GlobalLayer {
  meta: GlobalLayerFile;
  months: string[]; // "YYYY-MM", one per column
  bytes: DataView; // the decompressed int16 grid
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

/** "1981-01" plus `count` consecutive months. */
function monthAxis(start: string, count: number): string[] {
  const [y0, m0] = start.split("-").map(Number);
  return Array.from({ length: count }, (_, k) => {
    const total = y0 * 12 + (m0 - 1) + k;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  });
}

async function fetchLayer(name: GlobalLayerName): Promise<GlobalLayer> {
  const url = DATA_PATHS.globalLayer(name);
  const meta = await fetchJson<GlobalLayerFile>(url);
  requirePaths(url, meta, { file: "string", scale: "number", month_start: "string", n_months: "number", cells: "array", units: "string", dataset: "string" });
  const raw = await gunzip(await fetchBuffer(DATA_PATHS.globalFile(meta.file)));
  const expected = meta.cells.length * meta.n_months * 2;
  if (raw.byteLength !== expected) throw new DataShapeError(meta.file, `${raw.byteLength} bytes, expected ${expected}`);
  return { meta, months: monthAxis(meta.month_start, meta.n_months), bytes: new DataView(raw) };
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
  const { n_months, scale } = layer.meta;
  return Array.from({ length: n_months }, (_, m) => {
    const v = layer.bytes.getInt16((index * n_months + m) * 2, true);
    return v === NO_DATA ? null : v / scale;
  });
}
