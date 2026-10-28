// The two §15 ocean grids on the sst.bin layout: the SVS 5176 anomaly and MUR's hours since a
// 1 km infrared look (contract-15/ocean.ts). Loaded only by the views that play them.

import type { SstAnomalyMetadata, SstDtMetadata } from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { cellIndex, readInt16LE, readUint8 } from "./grid";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

export interface SstAnomalyField {
  meta: SstAnomalyMetadata;
  codes: Int16Array;
}

export interface SstDtField {
  meta: SstDtMetadata;
  codes: Uint8Array;
}

/** What a dt cell says: hours since a look, "no look" in MUR's window, or land. */
export type Clarity = { kind: "hours"; hours: number } | { kind: "noLook" } | null;

/** The anomaly's metadata alone (the Truth panel needs its check, not the grid). */
export async function loadSstAnomalyMeta(): Promise<SstAnomalyMetadata> {
  const meta = await fetchJson<SstAnomalyMetadata>(DATA_PATHS.sstAnomMeta);
  requirePaths("sst_anom.json", meta, { "grid.width": "number", "grid.height": "number", "grid.scale": "number", "grid.nodata": "number", verified: "object" });
  if (meta.grid.encoding !== "int16_scaled") throw new Error(`sst_anom.json: encoding "${meta.grid.encoding}" is not int16_scaled`);
  return meta;
}

export async function loadSstAnomaly(): Promise<SstAnomalyField> {
  const meta = await loadSstAnomalyMeta();
  return { meta, codes: readInt16LE(await fetchBuffer(DATA_PATHS.sstAnomGrid), meta.grid) };
}

export async function loadSstDt(): Promise<SstDtField> {
  const meta = await fetchJson<SstDtMetadata>(DATA_PATHS.sstDtMeta);
  requirePaths("sst_dt.json", meta, { "grid.width": "number", "grid.height": "number", "grid.nodata": "number", "grid.no_look": "number" });
  if (meta.grid.encoding !== "uint8_hours") throw new Error(`sst_dt.json: encoding "${meta.grid.encoding}" is not uint8_hours`);
  return { meta, codes: readUint8(await fetchBuffer(DATA_PATHS.sstDtGrid), meta.grid) };
}

/** °C vs normal at (lat, lon); null = land, sea ice or no data. */
export function anomalyAt(field: SstAnomalyField, lat: number, lon: number): number | null {
  const code = field.codes[cellIndex(field.meta.grid, lat, lon)];
  return code === field.meta.grid.nodata ? null : code / field.meta.grid.scale;
}

export function clarityAt(field: SstDtField, lat: number, lon: number): Clarity {
  const code = field.codes[cellIndex(field.meta.grid, lat, lon)];
  if (code === field.meta.grid.nodata) return null;
  if (code === field.meta.grid.no_look) return { kind: "noLook" };
  return { kind: "hours", hours: code };
}
