import type { LatLon } from "@/lib/data";
import { cellIndex } from "@/lib/data/grid";
import { decodeRain, decodeSst, type RainField, type SstField } from "@/lib/data/latest";
import { decodeSequenceCode, type SequenceFrame } from "@/lib/data/sequence";
import type { GridSize } from "@/lib/data/grid";
import { voiceSpec } from "@/lib/audio/mapping";
import type { ContinuousMapping } from "@/types/data-contract";
import { around, extremes, peakBand, rainAround, warmestAround, type Extreme, type LocalPattern, type ValueGrid } from "./stats";

export type DescribedRecord = "ocean" | "rain";

interface RainChange {
  before: number;
  after: number;
  minutes: number;
}

export type PlaceName = (at: LatLon) => string | null;

export interface PlaceNamers {
  name: PlaceName;
  region: PlaceName;
}

export interface Spot extends LatLon {
  place: string | null;
}

export interface RecordFacts {
  record: DescribedRecord;
  timeUtc: string;
  here: Spot;
  value: number | null;
  frozen: boolean;
  min: (Extreme & { place: string | null }) | null;
  max: (Extreme & { place: string | null }) | null;
  band: number | null;
  local: LocalPattern;
  change: RainChange | null;
}

export function sstGrid(f: SstField): ValueGrid {
  return { width: f.meta.grid.width, height: f.meta.grid.height, value: (i) => decodeSst(f.meta, f.codes[i]) };
}

export function rainGrid(f: RainField): ValueGrid {
  return { width: f.meta.grid.width, height: f.meta.grid.height, value: (i) => decodeRain(f.codes[i]) };
}

export interface RainFrame {
  field: object;
  grid: ValueGrid;
  timeUtc: string;
  frozenAt(index: number): boolean;
}

export function liveRainFrame(f: RainField): RainFrame {
  return { field: f, grid: rainGrid(f), timeUtc: f.meta.frame_time_utc, frozenAt: (i) => f.phases[i] === 2 };
}

export function sequenceRainFrame(frame: SequenceFrame, size: GridSize): RainFrame {
  return {
    field: frame,
    grid: { ...size, value: (i) => decodeSequenceCode(frame.codes[i]).mmPerHour },
    timeUtc: frame.ref.time_utc,
    frozenAt: (i) => decodeSequenceCode(frame.codes[i]).phase === "frozen",
  };
}

interface FrameFacts {
  range: ReturnType<typeof extremes>;
  band: number | null;
}
const frameCache = new WeakMap<object, FrameFacts>();

function frameFacts(field: object, grid: ValueGrid, withBand: boolean): FrameFacts {
  let facts = frameCache.get(field);
  if (!facts) {
    facts = { range: extremes(grid), band: withBand ? peakBand(grid) : null };
    frameCache.set(field, facts);
  }
  return facts;
}

const named = (e: Extreme | undefined, name: PlaceName) => (e ? { ...e, place: name(e) } : null);

export function oceanFacts(sst: SstField, at: LatLon, name: PlaceName): RecordFacts {
  const grid = sstGrid(sst);
  const { range, band } = frameFacts(sst, grid, true);
  return {
    record: "ocean",
    timeUtc: sst.meta.frame_time_utc,
    here: { ...at, place: name(at) },
    value: decodeSst(sst.meta, sst.codes[cellIndex(grid, at.lat, at.lon)]),
    frozen: false,
    min: named(range?.min, name),
    max: named(range?.max, name),
    band,
    local: warmestAround(around(grid, at)),
    change: null,
  };
}

export function rainFacts(frame: RainFrame, at: LatLon, name: PlaceName, change: RainChange | null): RecordFacts {
  const { range } = frameFacts(frame.field, frame.grid, false);
  const i = cellIndex(frame.grid, at.lat, at.lon);
  const value = frame.grid.value(i);
  return {
    record: "rain",
    timeUtc: frame.timeUtc,
    here: { ...at, place: name(at) },
    value,
    frozen: value !== null && value > 0 && frame.frozenAt(i),
    min: null,
    max: range && range.max.value > 0 ? named(range.max, name) : null,
    band: null,
    local: rainAround(around(frame.grid, at), (voiceSpec("rain").mapping as ContinuousMapping).input.min),
    change: value === null ? null : change,
  };
}
