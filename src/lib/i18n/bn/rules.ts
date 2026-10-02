// The Mapping panel's rule sentence in Bangla, built from the same parts as
// L2's English ruleText() (src/lib/audio/mapping-text.ts), so it can never
// disagree with the sound.

import { ruleParts } from "@/lib/audio/mapping";
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

/** A voice's Bangla name: mapping.json's, unless it is still marked TODO there. */
export function voiceLabelBn(voice: VoiceSpec): string {
  return voice.label.bn.startsWith("TODO") ? translateData(voice.label.en) : voice.label.bn;
}

export function ruleTextBn(voice: VoiceSpec): string {
  const p = ruleParts(voice);
  if (!p) return translateData(voice.silence);
  const name = voiceLabelBn(voice);
  const unit = translateData(p.inputUnit);

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
