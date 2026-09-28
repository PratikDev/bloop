// PURE: no Web Audio, no React. Every value → sound rule in the app is computed
// from public/mapping.json, so the Mapping panel (L3) and the audio engine (L2)
// always agree. Do not write these formulas anywhere else.
//
// This is the one import path for all of it (`@/lib/audio/mapping`); the code
// lives in the mapping-*.ts files beside it:
//   mapping-validate.ts  checks the file's shape and sanity
//   mapping-spec.ts      the validated mapping and voice lookup
//   mapping-maths.ts     value → sound maths, pan, loudness compensation
//   mapping-text.ts      rule sentences for the Mapping panel

export { MappingError, validateMapping } from "./mapping-validate";
export { MAPPING, voiceSpec } from "./mapping-spec";
export {
  bandFor,
  inverseContinuous,
  loudnessGain,
  mapContinuous,
  mapRuntime,
  mapVoice,
  normalise,
  panFor,
  runtimeRange,
  scaleOutput,
  type BandResult,
} from "./mapping-maths";
export { formatNumber, ruleParts, ruleText, type RuleParts } from "./mapping-text";
