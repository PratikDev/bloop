// PURE: checks the shape and sanity of a mapping file (public/mapping.json).
// A bad file fails loudly at start-up with a clear message.

import type { MappingSpec, VoiceMapping } from "@/types/data-contract";

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
