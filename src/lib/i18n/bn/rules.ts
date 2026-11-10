// The Mapping panel's rule sentence in Bangla, built from the same parts as
// L2's English ruleText() (src/lib/audio/mapping-text.ts), so it can never
// disagree with the sound.

import { ruleParts, ruleText } from "@/lib/audio/mapping";
import type { VoiceSpec } from "@/types/data-contract";
import { localDigits } from "../format";
import { translateData } from "./data";

const d = (s: string) => localDigits(s, "bn");

const PARAM_WORDS: Record<string, string> = {
  frequency: "সুরের উচ্চতা",
  dropsPerSecond: "ঘনত্ব",
  dropsPerStep: "ঘনত্ব",
  gain: "জোর",
};

// >>> DATA
const CLASS_SOUND_BN = { silence: "নীরবতা (বলে দেওয়া)", chord: "একটি স্থির কর্ড", rumble: "একটি স্থির গুমগুম শব্দ" } as const;
// <<< DATA

/** A voice's Bangla name: mapping.json's, unless it is still marked TODO there. */
export function voiceLabelBn(voice: VoiceSpec): string {
  return voice.label.bn.startsWith("TODO") ? translateData(voice.label.en) : voice.label.bn;
}

/**
 * The words a voice's rule needs that Bangla doesn't have yet: a parameter without a Bangla word, a unit
 * translateData() doesn't know, a "same rule as" voice, a falling output (bloop-dev's voices: normalTone, clarity,
 * unison, …). Empty = the Bangla sentence can be built. Listed in docs/i18n/TO_TRANSLATE.md.
 */
export function missingRuleWords(voice: VoiceSpec): string[] {
  const p = ruleParts(voice);
  if (!p) return [];
  const missing: string[] = [];
  if (p.kind === "sameAs") missing.push("a rule shared with another voice (sameAs)");
  if (p.outputFalling) missing.push("a falling output (higher value, lower output)");
  if (p.param !== undefined && !(p.param in PARAM_WORDS)) missing.push(`parameter: ${p.param}`);
  // Symbols and acronyms (Hz, s, cm, °C, NDVI) stay as they are in Bangla; a unit with an English word needs translating.
  for (const unit of [p.inputUnit, p.outputUnit]) if (unit && /[a-z]{3,}/u.test(unit) && translateData(unit) === unit) missing.push(`unit: ${unit}`);
  return missing;
}

/** The rule sentence in Bangla; English (ruleText) until its words are translated (missingRuleWords). */
export function ruleTextBn(voice: VoiceSpec): string {
  const p = ruleParts(voice);
  if (!p) return translateData(voice.silence);
  if (missingRuleWords(voice).length) return ruleText(voice);
  const name = voiceLabelBn(voice);
  const unit = translateData(p.inputUnit);

  // >>> DATA
  if (p.kind === "classes") {
    const parts = (p.classes ?? []).map((c) => `${translateData(c.label)}: ${CLASS_SOUND_BN[c.sound]}`);
    return `${name} (${unit}) → প্রতিটি শ্রেণির একটি স্থির শব্দ, কখনও সুরের উচ্চতা নয়। ${parts.join("; ")}।`;
  }
  // <<< DATA

  if (p.kind === "bands") {
    const what = p.inputTransform === "abs" ? `স্বাভাবিক থেকে কতটা দূরে (যেকোনো দিকে, ${unit})` : name;
    const parts: string[] = [];
    let lower: string | null = null;
    for (const b of p.bands ?? []) {
      const range = b.upTo === null ? `${d(lower ?? "")} বা তার বেশি` : lower === null ? `${d(b.upTo)}-এর নিচে` : `${d(lower)} থেকে ${d(b.upTo)}`;
      parts.push(`${range}: ${translateData(b.label)}`);
      lower = b.upTo;
    }
    return `${what} → সুরেলা থেকে বেসুরো। ${parts.join("; ")}।`;
  }

  const target = `${PARAM_WORDS[p.param ?? ""] ?? p.param} ${d(p.outputMin ?? "")} থেকে ${d(p.outputMax ?? "")} ${translateData(p.outputUnit ?? "")}`;
  const outScale = p.outputScale === "exponential" ? "সূচকীয়: মানের সমান ধাপ শোনায় সমান সুরের ধাপের মতো" : "রৈখিক";

  if (p.kind === "continuous") {
    const inScale = p.inputScale === "log" ? " (লগারিদমিক)" : "";
    return `${name} ${d(p.inputMin ?? "")} থেকে ${d(p.inputMax ?? "")} ${unit}${inScale} → ${target} (${outScale})।`;
  }

  const range = p.inputRange === "p5-p95" ? "যে ধারাটি বাজছে তার ৫ম থেকে ৯৫তম পারসেন্টাইল পর্যন্ত" : "শূন্য থেকে যে ধারাটি বাজছে তার সর্বোচ্চ মান পর্যন্ত";
  const transform = p.inputTransform === "log1p" ? ", লগারিদমিক স্কেলে" : "";
  return `${name} (${unit}), ${range}${transform} → ${target} (${outScale})।`;
}
