// The sound mapping spec, public/mapping.json (section 10). Re-exported from src/types/data-contract.ts.

import type { ClassesMapping, ExtraOutputParam, SameAsMapping } from "../contract-15";

// ---------------------------------------------------------------------------
// 10. Sound mapping spec (public/mapping.json)
// Owned by L2, not L1. Needed by BOTH: L3's Mapping panel renders it; L2's
// lib/audio reads the same numbers, so the two never drift apart.
// Rules are stored as numbers, never as formula text: the human-readable
// sentence is generated from these numbers (lib/audio/mapping.ts ruleText).
// ---------------------------------------------------------------------------

type InputScale = "linear" | "log";
type OutputScale = "linear" | "exponential";

// value → t in [0,1] over [input.min, input.max] (clamped; log uses log10),
// then t → output: linear = min + (max − min)·t; exponential = min·(max/min)^t.
// falling (§15): t → 1 − t first, so a higher value gives a lower output (the air "haze" cutoff).
export interface ContinuousMapping {
  kind: "continuous";
  input: { unit: string; min: number; max: number; scale: InputScale };
  output: {
    param: "frequency" | "dropsPerSecond" | "dropsPerStep" | "gain" | ExtraOutputParam;
    unit: string;
    min: number;
    max: number;
    scale: OutputScale;
    round?: boolean;
    falling?: boolean;
  };
}

// Discrete bands over the (optionally absolute) value; upTo = exclusive upper
// bound, null = no upper bound (last band only).
export interface BandsMapping {
  kind: "bands";
  input: { unit: string; transform: "abs" | "none" };
  bands: { upTo: number | null; label: string; detuneCents: number; roughness: number }[];
}

// Like continuous, but the input range is computed from the series being
// played (e.g. 5th–95th percentile), after an optional transform.
export interface RuntimeRangeMapping {
  kind: "runtimeRange";
  input: { unit: string; range: "p5-p95" | "zero-to-max"; transform: "none" | "log1p" };
  output: {
    param: "frequency" | "gain";
    unit: string;
    min: number;
    max: number;
    scale: OutputScale;
  };
}

// DATA: ClassesMapping (contract-15/classes.ts) for the class products (fire weather, landslide exposure).
export type VoiceMapping = ContinuousMapping | BandsMapping | RuntimeRangeMapping | SameAsMapping | ClassesMapping;

export interface VoiceSpec {
  id: string; // a voice id (lib/audio VoiceId) or an earcon id
  label: { en: string; bn: string };
  group: "live" | "thenNow" | "context" | "earcon";
  source: { dataset: string; svsId?: number; product?: string }; // product = its meta/freshness.json id (§15)
  status: "verified" | "context" | "designOnly"; // badge in the Mapping panel
  mapping: VoiceMapping | null; // null = no value rule (most earcons)
  silence: string; // when this voice is silent, and why
  sound: {
    timbre: string;
    attackMs: number;
    releaseMs: number;
    glideMs?: number;
    maxGain: number;
    family?: "model"; // §15 guardrail 15: every voice on a model/inventory product plays in the model timbre family
  };
  pan: "longitude" | "center" | "compareSide";
  legend: { value: number; label: string }[]; // reference points for the audio legend
  designChoice: boolean; // true = our untested choice, shown as such
  note?: string; // one line shown under the rule in the panel
}

export interface MappingSpec {
  version: string;
  global: {
    masterGain: number;
    voiceMaxGain: number;
    earconMaxGain: number;
    narrationMaxGain: number;
    maxConcurrentVoices: number;
    compressor: { thresholdDb: number; ratio: number; attackSec: number; releaseSec: number };
    duck: { level: number; attackSec: number; releaseSec: number };
    stopFadeMs: number;
    pan: { rule: "lon/180"; min: -1; max: 1 };
    // gain × (refHz / f)^exponent; exponent 0 = off (tuned by ear test T3)
    loudnessCompensation: { refHz: number; exponent: number };
    rules: string[]; // human sentences for the Mapping panel
  };
  voices: VoiceSpec[];
}
