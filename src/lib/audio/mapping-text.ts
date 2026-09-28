// PURE: human-readable rules for the Mapping panel (L3), generated from the
// numbers in mapping.json so the text can never disagree with the sound.

import type { VoiceMapping, VoiceSpec } from "@/types/data-contract";

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
