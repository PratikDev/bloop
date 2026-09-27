import type { OceanValue, RainValue, ValueAtResult } from "@/types/data-contract";
import { oceanAt, rainAt, type RainField, type SstField } from "./latest";

/** Today's decoded frames. Rain loads after first paint, so it may be missing. */
export interface LiveFields {
  sst: SstField;
  rain: RainField | null;
}

const RAIN_NOT_LOADED: RainValue = { track: "rain", mmPerHour: null, phase: "nodata" };

/**
 * The contract's valueAt(track, lat, lon), with the loaded frames passed in.
 * Rain that hasn't loaded yet reads as no data, never as dry.
 */
export function valueAt(fields: LiveFields, track: "ocean", lat: number, lon: number): OceanValue;
export function valueAt(fields: LiveFields, track: "rain", lat: number, lon: number): RainValue;
export function valueAt(fields: LiveFields, track: "ocean" | "rain", lat: number, lon: number): ValueAtResult {
  if (track === "ocean") return oceanAt(fields.sst, lat, lon);
  return fields.rain ? rainAt(fields.rain, lat, lon) : RAIN_NOT_LOADED;
}
