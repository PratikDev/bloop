// Today's frames: load L1's grids and decode one cell. Formulas are the ones in
// src/types/data-contract.ts §1; nothing here invents a value.

import type {
  OceanValue,
  RainMetadata,
  RainPhase,
  RainValue,
  SstMetadata,
} from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { cellIndex, readUint16LE, readUint8 } from "./grid";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

export interface SstField {
  meta: SstMetadata;
  codes: Uint16Array;
}

export interface RainField {
  meta: RainMetadata;
  codes: Uint16Array;
  phases: Uint8Array;
}

const RAIN_DRY = 0;
const RAIN_NODATA = 65535;
const PHASES: Record<number, RainPhase> = { 0: "dry", 1: "liquid", 2: "frozen" };

function requireEncoding(actual: string, expected: string, file: string) {
  if (actual !== expected) throw new Error(`${file}: encoding "${actual}" is not the "${expected}" this app decodes`);
}

export async function loadSst(): Promise<SstField> {
  const meta = await fetchJson<SstMetadata>(DATA_PATHS.sstMeta);
  requirePaths("sst.json", meta, { frame_time_utc: "string", "grid.width": "number", "grid.height": "number", "grid.scale": "number", "grid.offset": "number", "grid.nodata": "number" });
  requireEncoding(meta.grid.encoding, "uint16_offset", "sst.json");
  const codes = readUint16LE(await fetchBuffer(DATA_PATHS.sstGrid), meta.grid);
  return { meta, codes };
}

export async function loadRain(): Promise<RainField> {
  const meta = await fetchJson<RainMetadata>(DATA_PATHS.rainMeta);
  requirePaths("rain.json", meta, { frame_time_utc: "string", "grid.width": "number", "grid.height": "number", "grid.phase_file": "string", verified: "object" });
  requireEncoding(meta.grid.encoding, "uint16_log", "rain.json");
  const [codeBuf, phaseBuf] = await Promise.all([
    fetchBuffer(DATA_PATHS.rainGrid),
    fetchBuffer(DATA_PATHS.rainPhaseGrid(meta.grid.phase_file)),
  ]);
  return { meta, codes: readUint16LE(codeBuf, meta.grid), phases: readUint8(phaseBuf, meta.grid) };
}

/** °C = code / scale + offset; the nodata code means land or no data. */
export function decodeSst(meta: SstMetadata, code: number): number | null {
  return code === meta.grid.nodata ? null : code / meta.grid.scale + meta.grid.offset;
}

/** 0 = dry; 65535 = no data; else mm/h = 10^((code − 1) / 20000 − 1). */
export function decodeRain(code: number): number | null {
  if (code === RAIN_DRY) return 0;
  if (code === RAIN_NODATA) return null;
  return Math.pow(10, (code - 1) / 20000 - 1);
}

export function oceanAt(sst: SstField, lat: number, lon: number): OceanValue {
  return { track: "ocean", valueC: decodeSst(sst.meta, sst.codes[cellIndex(sst.meta.grid, lat, lon)]) };
}

export function rainAt(rain: RainField, lat: number, lon: number): RainValue {
  const i = cellIndex(rain.meta.grid, lat, lon);
  const mmPerHour = decodeRain(rain.codes[i]);
  if (mmPerHour === null) return { track: "rain", mmPerHour: null, phase: "nodata" };
  if (mmPerHour === 0) return { track: "rain", mmPerHour: 0, phase: "dry" };
  // A wet cell is liquid unless the phase grid says frozen (L1's grids agree today).
  return { track: "rain", mmPerHour, phase: PHASES[rain.phases[i]] === "frozen" ? "frozen" : "liquid" };
}
