// PURE: the value → sound maths of the Then vs Now voices (heat, monsoon,
// water), built on mapping.ts so every number comes from mapping.json.

import type { BandsMapping, RuntimeRangeMapping } from "@/types/data-contract";
import { bandFor, mapRuntime, mapVoice, runtimeRange, voiceSpec } from "./mapping";

export interface HeatTone {
  freq: number; // Hz, heat rule
  band: number; // Anomaly Choir band 0..3
  detuneCents: number; // second voice's detune (0 = no second voice)
  roughness: number; // 0..1, depth of the ~30 Hz wobble
}

/** A GISTEMP anomaly (°C) as the heat voice plays it: pitch + how unusual (warm and cold alike). */
export function heatTone(anomalyC: number): HeatTone | null {
  const freq = mapVoice("heat", anomalyC);
  if (freq === null) return null;
  const b = bandFor(anomalyC, voiceSpec("heatDeviation").mapping as BandsMapping);
  return { freq, band: b.index, detuneCents: b.detuneCents, roughness: b.roughness };
}

/** Frequency ratio of a detune in cents (100 cents = one semitone). */
export const centsToRatio = (cents: number) => Math.pow(2, cents / 1200);

/** Drops in one monsoon step: round(mm/day × 0.6) through the monsoon rule; null → 0. */
export function monsoonDrops(mmPerDay: number | null): number {
  return mapVoice("monsoon", mmPerDay) ?? 0;
}

/**
 * When a step's drops fall: `n` drops spread evenly across the step, each
 * nudged within ±30 % of its slot so it doesn't sound mechanical. Always
 * inside [start, start + stepSec).
 */
export function stepDropTimes(n: number, stepSec: number, start: number, random: () => number = Math.random): number[] {
  if (n <= 0) return [];
  const slot = stepSec / n;
  return Array.from({ length: n }, (_, i) => start + slot * (i + 0.5 + (random() - 0.5) * 0.6));
}

/** The water rule's input range over the series being played (5th–95th percentile, nulls ignored). */
export function waterRange(series: readonly (number | null)[]) {
  return runtimeRange(series, (voiceSpec("water").mapping as RuntimeRangeMapping).input);
}

/** GRACE cm → bass Hz within a range from waterRange(); null (no measurement) → null. */
export function waterFreq(cm: number | null, range: { min: number; max: number }): number | null {
  return mapRuntime(cm, voiceSpec("water").mapping as RuntimeRangeMapping, range);
}

/** Runs of missing values as [first index, last index] (each gets one gap caption). */
export function missingRuns(values: readonly (number | null)[]): [number, number][] {
  const runs: [number, number][] = [];
  values.forEach((v, i) => {
    if (v !== null) return;
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  return runs;
}
