import { continuousRule } from "@/lib/audio/mapping-maths";
import { decodeCode, decodeSequenceCode, type OfficialGrid, type RainField, type SstField } from "@/lib/data";
import { decodeRain, decodeSst } from "@/lib/data/latest";
import type { ValueTrust } from "@/lib/audio/layers/types";
import type { OfficialStatus } from "@/types/data-contract";
import { GLOBAL_BOUNDS, type BoxGrid, type HistAxis } from "./boxes";

export interface ReadSource {
  recordId: string;
  name: string;
  unit: string;
  trust: ValueTrust;
  status: OfficialStatus | "verified";
  axis: HistAxis;
  pitchVoice: string | null;
  timeUtc: string | null;
  timeLabel: string | null;
  grid: BoxGrid;
}

function trustOf(status: OfficialStatus): ValueTrust {
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

export const latestRainSource = (rain: RainField, label: string): ReadSource =>
  rainSource(label, rain.meta.frame_time_utc, { width: rain.meta.grid.width, height: rain.meta.grid.height, value: (i) => decodeRain(rain.codes[i]) });

export const sequenceRainSource = (size: { width: number; height: number }, codes: Uint8Array, timeUtc: string, label: string): ReadSource =>
  rainSource(label, timeUtc, { ...size, value: (i) => decodeSequenceCode(codes[i]).mmPerHour });

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
