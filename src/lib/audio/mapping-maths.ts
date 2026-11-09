// PURE: value → sound maths for every rule in mapping.json (continuous,
// bands, runtime range), plus stereo position and loudness compensation.

import type { BandsMapping, ContinuousMapping, MappingSpec, RuntimeRangeMapping } from "@/types/data-contract";
import { MAPPING, voiceSpec } from "./mapping-spec";
import { checkRange, fail, MappingError } from "./mapping-validate";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * value → t in [0,1] over the input range (clamped).
 * null stays null. On a log input, values <= 0 have no position and return null
 * (for rain that means dry; the caller handles dry separately).
 */
export function normalise(
  value: number | null,
  input: { min: number; max: number; scale: "linear" | "log" },
): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (input.scale === "log") {
    if (value <= 0) return null;
    const lo = Math.log10(input.min);
    const hi = Math.log10(input.max);
    return clamp((Math.log10(value) - lo) / (hi - lo), 0, 1);
  }
  return clamp((value - input.min) / (input.max - input.min), 0, 1);
}

/** t in [0,1] → output value (falling: a higher t gives a lower output). */
export function scaleOutput(
  t: number,
  output: { min: number; max: number; scale: "linear" | "exponential"; round?: boolean; falling?: boolean },
): number {
  const tt = output.falling ? 1 - clamp(t, 0, 1) : clamp(t, 0, 1);
  const y =
    output.scale === "exponential"
      ? output.min * Math.pow(output.max / output.min, tt)
      : output.min + (output.max - output.min) * tt;
  return output.round ? Math.round(y) : y;
}

/** A continuous rule: value → Hz / drops per second / drops per step / gain. */
export function mapContinuous(value: number | null, mapping: ContinuousMapping): number | null {
  const t = normalise(value, mapping.input);
  return t === null ? null : scaleOutput(t, mapping.output);
}

/** The inverse of mapContinuous (falling rules too): the input value that produces `output` (clamped to the rule's range). */
export function inverseContinuous(output: number, mapping: ContinuousMapping): number {
  const { input, output: out } = mapping;
  const t =
    out.scale === "exponential"
      ? Math.log(output / out.min) / Math.log(out.max / out.min)
      : (output - out.min) / (out.max - out.min);
  const position = clamp(Number.isFinite(t) ? t : 0, 0, 1);
  const tt = out.falling ? 1 - position : position; // a falling rule: a higher output came from a lower value
  if (input.scale === "log") {
    const lo = Math.log10(input.min);
    return Math.pow(10, lo + (Math.log10(input.max) - lo) * tt);
  }
  return input.min + (input.max - input.min) * tt;
}

/**
 * The same continuous rule over a narrower input range: a zoomed axis (Sound
 * terrain plays the ocean rule over a region's own range). Output and scales
 * stay the rule's own; mapping.json is not changed. Throws on an empty range.
 */
export function withInputRange(mapping: ContinuousMapping, range: { min: number; max: number }): ContinuousMapping {
  checkRange(range.min, range.max, "zoomed axis");
  if (mapping.input.scale === "log" && range.min <= 0) fail("zoomed axis: log scale needs min > 0");
  return { ...mapping, input: { ...mapping.input, min: range.min, max: range.max } };
}

/** A voice's continuous rule, following a sameAs rule to the voice it names. */
export function continuousRule(id: string, spec: MappingSpec = MAPPING): ContinuousMapping {
  const m = voiceSpec(id, spec).mapping;
  const rule = m?.kind === "sameAs" ? voiceSpec(m.voice, spec).mapping : m;
  if (rule?.kind !== "continuous") throw new MappingError(`voice "${id}" has no continuous rule`);
  return rule;
}

/** Semitones per input unit of an exponential pitch rule on a linear input (the Ocean rule: 24 over 40 °C). Null otherwise. */
export function semitonesPerUnit(rule: ContinuousMapping): number | null {
  if (rule.output.param !== "frequency" || rule.output.scale !== "exponential" || rule.input.scale !== "linear") return null;
  return (12 * Math.log2(rule.output.max / rule.output.min)) / (rule.input.max - rule.input.min);
}

/** Proof in unison (C1): a checked point's two values as Hz on the unison voice's rule, and their beat rate |f1 − f2|. */
export function unisonTones(frameC: number, fileC: number, spec: MappingSpec = MAPPING): { frameHz: number; fileHz: number; beatsPerSec: number } | null {
  const rule = continuousRule("unison", spec);
  const frameHz = mapContinuous(frameC, rule);
  const fileHz = mapContinuous(fileC, rule);
  return frameHz === null || fileHz === null ? null : { frameHz, fileHz, beatsPerSec: Math.abs(frameHz - fileHz) };
}

/** Convenience: apply a voice's continuous rule by id (e.g. mapVoice("ocean", 28.4) → Hz). */
export function mapVoice(id: string, value: number | null, spec: MappingSpec = MAPPING): number | null {
  return mapContinuous(value, continuousRule(id, spec));
}

export interface BandResult {
  index: number;
  label: string;
  detuneCents: number;
  roughness: number;
}

/** A bands rule: which band a value falls in. upTo is an exclusive upper bound. */
export function bandFor(value: number, mapping: BandsMapping): BandResult {
  const x = mapping.input.transform === "abs" ? Math.abs(value) : value;
  const i = mapping.bands.findIndex((b) => b.upTo === null || x < b.upTo);
  const index = i === -1 ? mapping.bands.length - 1 : i;
  const b = mapping.bands[index];
  return { index, label: b.label, detuneCents: b.detuneCents, roughness: b.roughness };
}

/** Linear-interpolated percentile (same as numpy's default), p in [0,100]. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const pos = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function transformValue(v: number, transform: "none" | "log1p"): number {
  return transform === "log1p" ? Math.log1p(v) : v;
}

/**
 * The input range of a runtime-range rule, computed from the series being played
 * (after its transform). Nulls (missing months) are ignored. Returns null if the
 * series has no values.
 */
export function runtimeRange(
  series: readonly (number | null)[],
  input: { range: "p5-p95" | "zero-to-max"; transform: "none" | "log1p" },
): { min: number; max: number } | null {
  const vals = series
    .filter((v): v is number => v !== null && Number.isFinite(v))
    .map((v) => transformValue(v, input.transform))
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  if (input.range === "zero-to-max") return { min: 0, max: vals[vals.length - 1] };
  return { min: percentile(vals, 5), max: percentile(vals, 95) };
}

/** A runtime-range rule: value → output, given the range from runtimeRange(). */
export function mapRuntime(
  value: number | null,
  mapping: RuntimeRangeMapping,
  range: { min: number; max: number },
): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const x = transformValue(value, mapping.input.transform);
  const t = range.max > range.min ? clamp((x - range.min) / (range.max - range.min), 0, 1) : 0.5;
  return scaleOutput(t, mapping.output);
}

/** Stereo position from longitude: west −1 (left) … east +1 (right). */
export function panFor(lon: number): number {
  return clamp(lon / 180, -1, 1);
}

/** Gain multiplier so pitches sound equally loud: (refHz / f)^exponent; 1 when off. */
export function loudnessGain(
  freqHz: number,
  comp: { refHz: number; exponent: number } = MAPPING.global.loudnessCompensation,
): number {
  if (comp.exponent === 0 || freqHz <= 0) return 1;
  return Math.pow(comp.refHz / freqHz, comp.exponent);
}
