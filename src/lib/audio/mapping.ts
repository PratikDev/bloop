// PURE: no Web Audio, no React. Every value → sound rule in the app is computed
// here from public/mapping.json, so the Mapping panel (L3) and the audio engine
// (L2) always agree. Do not write these formulas anywhere else.

import raw from "../../../public/mapping.json";
import type {
  BandsMapping,
  ContinuousMapping,
  MappingSpec,
  RuntimeRangeMapping,
  VoiceMapping,
  VoiceSpec,
} from "@/types/data-contract";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class MappingError extends Error {
  constructor(message: string) {
    super(`mapping.json: ${message}`);
    this.name = "MappingError";
  }
}

function fail(message: string): never {
  throw new MappingError(message);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown, where: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${where} must be a finite number`);
  return v;
}

function str(v: unknown, where: string): string {
  if (typeof v !== "string" || v.length === 0) fail(`${where} must be a non-empty string`);
  return v;
}

function oneOf<T extends string>(v: unknown, options: readonly T[], where: string): T {
  if (typeof v !== "string" || !options.includes(v as T)) {
    fail(`${where} must be one of ${options.join(", ")}`);
  }
  return v as T;
}

function checkRange(min: number, max: number, where: string) {
  if (min >= max) fail(`${where}: min (${min}) must be less than max (${max})`);
}

function checkOutput(o: unknown, where: string) {
  if (!isObject(o)) fail(`${where} is missing`);
  str(o.unit, `${where}.unit`);
  const min = num(o.min, `${where}.min`);
  const max = num(o.max, `${where}.max`);
  checkRange(min, max, where);
  const scale = oneOf(o.scale, ["linear", "exponential"] as const, `${where}.scale`);
  if (scale === "exponential" && min <= 0) fail(`${where}: exponential scale needs min > 0`);
}

function checkMapping(m: unknown, where: string) {
  if (m === null) return;
  if (!isObject(m)) fail(`${where} must be an object or null`);
  const kind = oneOf(m.kind, ["continuous", "bands", "runtimeRange"] as const, `${where}.kind`);
  const input = m.input;
  if (!isObject(input)) fail(`${where}.input is missing`);
  str(input.unit, `${where}.input.unit`);

  if (kind === "continuous") {
    const min = num(input.min, `${where}.input.min`);
    const max = num(input.max, `${where}.input.max`);
    checkRange(min, max, `${where}.input`);
    const scale = oneOf(input.scale, ["linear", "log"] as const, `${where}.input.scale`);
    if (scale === "log" && min <= 0) fail(`${where}.input: log scale needs min > 0`);
    oneOf(
      (m.output as Record<string, unknown> | undefined)?.param,
      ["frequency", "dropsPerSecond", "dropsPerStep", "gain"] as const,
      `${where}.output.param`,
    );
    checkOutput(m.output, `${where}.output`);
  } else if (kind === "runtimeRange") {
    oneOf(input.range, ["p5-p95", "zero-to-max"] as const, `${where}.input.range`);
    oneOf(input.transform, ["none", "log1p"] as const, `${where}.input.transform`);
    oneOf(
      (m.output as Record<string, unknown> | undefined)?.param,
      ["frequency", "gain"] as const,
      `${where}.output.param`,
    );
    checkOutput(m.output, `${where}.output`);
  } else {
    oneOf(input.transform, ["abs", "none"] as const, `${where}.input.transform`);
    const bands = m.bands;
    if (!Array.isArray(bands) || bands.length === 0) fail(`${where}.bands must be a non-empty array`);
    let prev = -Infinity;
    bands.forEach((b: unknown, i) => {
      const w = `${where}.bands[${i}]`;
      if (!isObject(b)) fail(`${w} must be an object`);
      str(b.label, `${w}.label`);
      num(b.detuneCents, `${w}.detuneCents`);
      num(b.roughness, `${w}.roughness`);
      const last = i === bands.length - 1;
      if (b.upTo === null) {
        if (!last) fail(`${w}.upTo can only be null on the last band`);
        return;
      }
      const upTo = num(b.upTo, `${w}.upTo`);
      if (upTo <= prev) fail(`${where}.bands must be in ascending order of upTo`);
      prev = upTo;
    });
  }
}

/** Checks the shape and sanity of a mapping file. Throws MappingError with a clear message. */
export function validateMapping(input: unknown): MappingSpec {
  if (!isObject(input)) fail("root must be an object");
  str(input.version, "version");

  const g = input.global;
  if (!isObject(g)) fail("global is missing");
  const voiceMax = num(g.voiceMaxGain, "global.voiceMaxGain");
  const earconMax = num(g.earconMaxGain, "global.earconMaxGain");
  for (const k of ["masterGain", "voiceMaxGain", "earconMaxGain", "narrationMaxGain"] as const) {
    const v = num(g[k], `global.${k}`);
    if (v <= 0 || v > 1) fail(`global.${k} must be in (0, 1]`);
  }
  num(g.maxConcurrentVoices, "global.maxConcurrentVoices");
  num(g.stopFadeMs, "global.stopFadeMs");
  for (const [k, fields] of [
    ["compressor", ["thresholdDb", "ratio", "attackSec", "releaseSec"]],
    ["duck", ["level", "attackSec", "releaseSec"]],
    ["loudnessCompensation", ["refHz", "exponent"]],
  ] as const) {
    const o = g[k];
    if (!isObject(o)) fail(`global.${k} is missing`);
    for (const f of fields) num(o[f], `global.${k}.${f}`);
  }
  if (!Array.isArray(g.rules)) fail("global.rules must be an array");

  const voices = input.voices;
  if (!Array.isArray(voices) || voices.length === 0) fail("voices must be a non-empty array");
  const seen = new Set<string>();
  voices.forEach((v: unknown, i) => {
    if (!isObject(v)) fail(`voices[${i}] must be an object`);
    const id = str(v.id, `voices[${i}].id`);
    const where = `voice "${id}"`;
    if (seen.has(id)) fail(`${where} is listed twice`);
    seen.add(id);

    if (!isObject(v.label)) fail(`${where}.label is missing`);
    str(v.label.en, `${where}.label.en`);
    str(v.label.bn, `${where}.label.bn`);
    const group = oneOf(v.group, ["live", "thenNow", "context", "earcon"] as const, `${where}.group`);
    if (!isObject(v.source)) fail(`${where}.source is missing`);
    str(v.source.dataset, `${where}.source.dataset`);
    oneOf(v.status, ["verified", "context", "designOnly"] as const, `${where}.status`);
    str(v.silence, `${where}.silence`);
    oneOf(v.pan, ["longitude", "center", "compareSide"] as const, `${where}.pan`);
    if (typeof v.designChoice !== "boolean") fail(`${where}.designChoice must be true or false`);

    const s = v.sound;
    if (!isObject(s)) fail(`${where}.sound is missing`);
    str(s.timbre, `${where}.sound.timbre`);
    num(s.attackMs, `${where}.sound.attackMs`);
    num(s.releaseMs, `${where}.sound.releaseMs`);
    const maxGain = num(s.maxGain, `${where}.sound.maxGain`);
    const cap = group === "earcon" ? earconMax : voiceMax;
    if (maxGain <= 0 || maxGain > cap) {
      fail(`${where}.sound.maxGain (${maxGain}) must be in (0, ${cap}] for group "${group}"`);
    }

    checkMapping(v.mapping, `${where}.mapping`);

    if (!Array.isArray(v.legend)) fail(`${where}.legend must be an array`);
    const m = v.mapping as VoiceMapping | null;
    v.legend.forEach((p: unknown, j) => {
      if (!isObject(p)) fail(`${where}.legend[${j}] must be an object`);
      const value = num(p.value, `${where}.legend[${j}].value`);
      str(p.label, `${where}.legend[${j}].label`);
      if (m?.kind === "continuous" && (value < m.input.min || value > m.input.max)) {
        fail(`${where}.legend[${j}] value ${value} is outside the input range`);
      }
    });
  });

  return input as unknown as MappingSpec;
}

// The app's mapping, validated once at import. A bad file fails loudly at start-up.
export const MAPPING: MappingSpec = validateMapping(raw);

/** Looks up a voice (or earcon) by id. Throws if it isn't in mapping.json. */
export function voiceSpec(id: string, spec: MappingSpec = MAPPING): VoiceSpec {
  const v = spec.voices.find((x) => x.id === id);
  if (!v) throw new MappingError(`no voice with id "${id}"`);
  return v;
}

// ---------------------------------------------------------------------------
// Value → sound maths
// ---------------------------------------------------------------------------

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

/** t in [0,1] → output value. */
export function scaleOutput(
  t: number,
  output: { min: number; max: number; scale: "linear" | "exponential"; round?: boolean },
): number {
  const tt = clamp(t, 0, 1);
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

/** Convenience: apply a voice's continuous rule by id (e.g. mapVoice("ocean", 28.4) → Hz). */
export function mapVoice(id: string, value: number | null, spec: MappingSpec = MAPPING): number | null {
  const m = voiceSpec(id, spec).mapping;
  if (m?.kind !== "continuous") throw new MappingError(`voice "${id}" has no continuous rule`);
  return mapContinuous(value, m);
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

// ---------------------------------------------------------------------------
// Human-readable rules for the Mapping panel (generated from the numbers)
// ---------------------------------------------------------------------------

/** Formats a number for display: true minus sign, no trailing zeros. */
export function formatNumber(n: number): string {
  const s = Number.isInteger(n) ? String(Math.abs(n)) : String(Number(Math.abs(n).toPrecision(4)));
  return n < 0 ? `−${s}` : s;
}

const PARAM_WORDS: Record<string, string> = {
  frequency: "pitch",
  dropsPerSecond: "density",
  dropsPerStep: "density",
  gain: "strength",
};

/**
 * The pieces of a rule, so L3 can build the sentence in either language.
 * Returns null for voices without a value rule (most earcons).
 */
export interface RuleParts {
  kind: VoiceMapping["kind"];
  inputUnit: string;
  inputMin?: string;
  inputMax?: string;
  inputScale?: "linear" | "log";
  inputRange?: "p5-p95" | "zero-to-max";
  inputTransform?: "none" | "log1p" | "abs";
  param?: string;
  outputUnit?: string;
  outputMin?: string;
  outputMax?: string;
  outputScale?: "linear" | "exponential";
  bands?: { upTo: string | null; label: string }[];
}

export function ruleParts(voice: VoiceSpec): RuleParts | null {
  const m = voice.mapping;
  if (!m) return null;
  if (m.kind === "bands") {
    return {
      kind: m.kind,
      inputUnit: m.input.unit,
      inputTransform: m.input.transform,
      bands: m.bands.map((b) => ({ upTo: b.upTo === null ? null : formatNumber(b.upTo), label: b.label })),
    };
  }
  const common = {
    param: m.output.param,
    outputUnit: m.output.unit,
    outputMin: formatNumber(m.output.min),
    outputMax: formatNumber(m.output.max),
    outputScale: m.output.scale,
  };
  if (m.kind === "continuous") {
    return {
      kind: m.kind,
      inputUnit: m.input.unit,
      inputMin: formatNumber(m.input.min),
      inputMax: formatNumber(m.input.max),
      inputScale: m.input.scale,
      ...common,
    };
  }
  return {
    kind: m.kind,
    inputUnit: m.input.unit,
    inputRange: m.input.range,
    inputTransform: m.input.transform,
    ...common,
  };
}

/** The English rule sentence shown in the Mapping panel. Bangla: build from ruleParts(). */
export function ruleText(voice: VoiceSpec): string {
  const p = ruleParts(voice);
  if (!p) return voice.silence;
  const name = voice.label.en;

  if (p.kind === "bands") {
    const what = p.inputTransform === "abs" ? `How far from normal (either direction, ${p.inputUnit})` : name;
    const parts: string[] = [];
    let lower: string | null = null;
    for (const b of p.bands ?? []) {
      const range =
        b.upTo === null ? `${lower} or more` : lower === null ? `below ${b.upTo}` : `${lower} to ${b.upTo}`;
      parts.push(`${range}: ${b.label}`);
      lower = b.upTo;
    }
    return `${what} → consonant to dissonant. ${parts.join("; ")}.`;
  }

  const target = `${PARAM_WORDS[p.param ?? ""] ?? p.param} ${p.outputMin} to ${p.outputMax} ${p.outputUnit}`;
  const outScale =
    p.outputScale === "exponential"
      ? "exponential: equal steps in value sound like equal musical steps"
      : "linear";

  if (p.kind === "continuous") {
    const inScale = p.inputScale === "log" ? " (logarithmic)" : "";
    return `${name} ${p.inputMin} to ${p.inputMax} ${p.inputUnit}${inScale} → ${target} (${outScale}).`;
  }

  const range =
    p.inputRange === "p5-p95"
      ? "from the 5th to the 95th percentile of the series being played"
      : "from zero to the largest value in the series being played";
  const transform = p.inputTransform === "log1p" ? ", on a logarithmic scale" : "";
  return `${name} (${p.inputUnit}), ${range}${transform} → ${target} (${outScale}).`;
}
