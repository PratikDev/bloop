// PURE: checks the shape and sanity of a mapping file (public/mapping.json).
// A bad file fails loudly at start-up with a clear message.
import type { MappingSpec, VoiceMapping, VoiceSpec } from "@/types/data-contract";
import { fail, isObject, num, str, oneOf, checkMapping } from "./mapping-checks";
export { checkRange, fail, MappingError } from "./mapping-checks";

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

  // A sameAs rule must point at another voice that has a continuous rule (one rule, two uses: no copied numbers).
  for (const v of voices as VoiceSpec[]) {
    const m = v.mapping;
    if (m?.kind !== "sameAs") continue;
    const target = (voices as VoiceSpec[]).find((x) => x.id === m.voice && x.id !== v.id);
    if (target?.mapping?.kind !== "continuous") fail(`voice "${v.id}".mapping.voice must name a voice with a continuous rule`);
  }

  return input as unknown as MappingSpec;
}
