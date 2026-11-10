// What the panel and the chord read from: one frame of one record as a BoxGrid, with how its values may be used. The
// adapters decode with the app's own functions (latest.ts, sequence.ts, official.ts), so the panel reads exactly the
// values the needle plays.
import { continuousRule } from "@/lib/audio/mapping-maths";
import { decodeCode, decodeSequenceCode, type OfficialGrid, type RainField, type SstField } from "@/lib/data";
import { decodeRain, decodeSst } from "@/lib/data/latest";
import type { ValueTrust } from "@/lib/audio/layers/types";
import type { OfficialStatus } from "@/types/data-contract";
import { GLOBAL_BOUNDS, type BoxGrid, type HistAxis } from "./box-stats";

export interface ReadSource {
  /** A Listen voice id ("ocean", "rain") or an official record id. */
  recordId: string;
  /** The record's name as the app shows it elsewhere (a voice label, a layer label). */
  name: string;
  /** "" for relative and pattern-only records (no units shown). */
  unit: string;
  trust: ValueTrust;
  status: OfficialStatus | "verified";
  axis: HistAxis;
  /** The voice whose value -> pitch rule the chord plays through; null when the record plays no pitch. */
  pitchVoice: string | null;
  timeUtc: string | null;
  /** A frame shown as a period (an annual composite); else the time is shown. */
  timeLabel: string | null;
  grid: BoxGrid;
}

/** A record's status as the chord and panel use it (verified / stated error / relative / pattern only). */
export function trustOf(status: OfficialStatus): ValueTrust {
  switch (status) {
    case "verified":
      return "verified";
    case "values with stated error":
    case "observation":
      return "stated";
    case "relative":
      return "relative";
    default:
      return "pattern";
  }
}

const ruleAxis = (voice: string): HistAxis => {
  const { input } = continuousRule(voice);
  return { min: input.min, max: input.max, log: input.scale === "log" };
};
const pitchOf = (voice: string): string | null => (continuousRule(voice).output.param === "frequency" ? voice : null);

/** Live SST (SVS 5101): the Listen ocean voice. */
export function sstSource(sst: SstField, label: string): ReadSource {
  const { width, height } = sst.meta.grid;
  return {
    recordId: "ocean",
    name: label,
    unit: continuousRule("ocean").input.unit,
    trust: "verified",
    status: "verified",
    axis: ruleAxis("ocean"),
    pitchVoice: pitchOf("ocean"),
    timeUtc: sst.meta.frame_time_utc,
    timeLabel: null,
    grid: { width, height, bounds: GLOBAL_BOUNDS, value: (i) => decodeSst(sst.meta, sst.codes[i]) },
  };
}

const rainSource = (label: string, timeUtc: string, grid: Omit<BoxGrid, "bounds">): ReadSource => ({
  recordId: "rain",
  name: label,
  unit: continuousRule("rain").input.unit,
  trust: "verified",
  status: "verified",
  axis: ruleAxis("rain"),
  pitchVoice: pitchOf("rain"),
  timeUtc,
  timeLabel: null,
  grid: { ...grid, bounds: GLOBAL_BOUNDS },
});

/** The latest IMERG rain frame (SVS 4285): dry is a value (0 mm/h), not no data. */
export const latestRainSource = (rain: RainField, label: string): ReadSource =>
  rainSource(label, rain.meta.frame_time_utc, { width: rain.meta.grid.width, height: rain.meta.grid.height, value: (i) => decodeRain(rain.codes[i]) });

/** One frame of the 48-frame IMERG sequence. */
export const sequenceRainSource = (size: { width: number; height: number }, codes: Uint8Array, timeUtc: string, label: string): ReadSource =>
  rainSource(label, timeUtc, { ...size, value: (i) => decodeSequenceCode(codes[i]).mmPerHour });

/** One time step of an official record's layer, played by `voice`. */
export function officialSource(recordId: string, grid: OfficialGrid, step: number, voice: string): ReadSource {
  const { layer } = grid;
  const trust = trustOf(layer.status);
  const codes = grid.steps[Math.max(0, Math.min(grid.steps.length - 1, step))];
  const [lo, hi] = layer.value_range ?? [continuousRule(voice).input.min, continuousRule(voice).input.max];
  const log = layer.encoding === "log10";
  return {
    recordId,
    name: layer.label,
    unit: trust === "relative" || trust === "pattern" ? "" : layer.unit,
    trust,
    status: layer.status,
    axis: { min: log ? Math.max(lo, Number.MIN_VALUE) : lo, max: hi, log },
    pitchVoice: pitchOf(voice),
    timeUtc: layer.times[step] ?? null,
    timeLabel: layer.time_labels?.[step] ?? null,
    grid: { width: layer.grid.width, height: layer.grid.height, bounds: layer.grid.bounds, value: (i) => decodeCode(layer, codes[i])?.value ?? null },
  };
}
