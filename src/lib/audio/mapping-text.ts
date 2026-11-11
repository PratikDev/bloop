// PURE: human-readable rules for the Mapping panel (L3), generated from the
// numbers in mapping.json so the text can never disagree with the sound.

import type { VoiceMapping, VoiceSpec } from "@/types/data-contract";
import { voiceSpec } from "./mapping-spec";

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
  reverbSec: "echo length",
  cutoff: "low-pass cutoff (brightness)",
  clicksPerSecond: "clicks per second",
};

const CLASS_SOUND_WORDS = { silence: "silence (stated)", chord: "a fixed chord", rumble: "a fixed rumble" } as const;

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
  outputFalling?: boolean;
  bands?: { upTo: string | null; label: string }[];
  sameAs?: string; // the voice whose rule is used
  /** A categorical rule: each class's label and its fixed sound ("silence", "chord", "rumble"). */
  classes?: { label: string; sound: "silence" | "chord" | "rumble" }[];
}

export function ruleParts(voice: VoiceSpec): RuleParts | null {
  const m = voice.mapping;
  if (!m) return null;
  if (m.kind === "sameAs") return { kind: m.kind, inputUnit: m.input.unit, sameAs: m.voice };
  if (m.kind === "classes") return { kind: m.kind, inputUnit: m.input.unit, classes: m.states.map((s) => ({ label: s.label, sound: s.sound })) };
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
    outputFalling: m.kind === "continuous" && m.output.falling === true,
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

/** The English rule sentence shown in the Mapping panel. Bangla: build from ruleParts. */
export function ruleText(voice: VoiceSpec): string {
  const p = ruleParts(voice);
  if (!p) return voice.silence;
  const name = voice.label.en;

  if (p.kind === "sameAs" && p.sameAs) {
    const other = voiceSpec(p.sameAs);
    return `${name}: two tones in one ear, both by the ${other.label.en} rule (${ruleText(other)}) Beats per second = the difference between the two pitches in Hz.`;
  }

  if (p.kind === "classes") {
    const parts = (p.classes ?? []).map((c) => `${c.label}: ${CLASS_SOUND_WORDS[c.sound]}`);
    return `${name} (${p.inputUnit}) → a fixed sound per class, never a pitch. ${parts.join("; ")}.`;
  }

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

  const [from, to] = p.outputFalling ? [p.outputMax, p.outputMin] : [p.outputMin, p.outputMax];
  const target = `${PARAM_WORDS[p.param ?? ""] ?? p.param} ${from} to ${to} ${p.outputUnit}`;
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
