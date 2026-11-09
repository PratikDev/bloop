// Comic sound words: one English and one Bangla word for each thing a live voice can sound like. Only the three
// live voices the map and the legend play have words. "Light" and "heavy" rain and "warm" and "cool" sea are one
// voice each (mapping.json), so they are registers of that voice, split on that voice's own rule. A word is only
// ever shown for a sound the engine is really playing: see needleSoundWord and legendSoundWord.

import { continuousRule, voiceSpec } from "@/lib/audio/mapping";
import type { AudioEvent, LiveVoiceId, RainPhase } from "@/lib/audio-adapter/types";

interface SoundWord {
  voice: LiveVoiceId;
  en: string;
  bn: string;
  /** A first draft of the Bangla word, waiting for a Bangla speaker's review. */
  bnDraft?: true;
}

export const SOUND_WORDS = {
  rainLight: { voice: "rain", en: "plip", bn: "টুপটাপ" },
  rainHeavy: { voice: "rain", en: "drum", bn: "ঝমঝম" },
  oceanWarm: { voice: "ocean", en: "hum", bn: "গুনগুন" },
  oceanCool: { voice: "ocean", en: "hoo", bn: "হু হু", bnDraft: true },
  snow: { voice: "snow", en: "hush", bn: "ফিসফিস", bnDraft: true },
} as const satisfies Record<string, SoundWord>;

export type SoundWordId = keyof typeof SOUND_WORDS;

/** Rain from mapping.json's "moderate" legend point up is dense enough to be a drum rather than single drops. */
export const RAIN_DRUM_FROM_MM = voiceSpec("rain").legend.find((p) => p.label.includes("moderate"))?.value ?? Number.POSITIVE_INFINITY;

const oceanInput = continuousRule("ocean").input;
/** The centre of the ocean rule: warmer water is the upper half of its pitch range. */
export const OCEAN_WARM_FROM_C = (oceanInput.min + oceanInput.max) / 2;

/** The word for a value on a live voice's rule (°C for the ocean, mm/h for rain and snow). */
export function soundWordFor(voice: LiveVoiceId, value: number): SoundWordId {
  switch (voice) {
    case "ocean":
      return value >= OCEAN_WARM_FROM_C ? "oceanWarm" : "oceanCool";
    case "rain":
      return value >= RAIN_DRUM_FROM_MM ? "rainHeavy" : "rainLight";
    case "snow":
      return "snow";
  }
}

/** On the map: pop 120 ms + hold 600 ms + fade 200 ms (the steps of animate-sound-word in globals.css). */
export const SOUND_WORD_SHOW_MS = 920;
export const SOUND_WORD_GAP_MS = 1500;
export const SOUND_WORD_GAP_REDUCED_MS = 3000;

/** At most one word per gap, however often the voices sound. */
export function createSoundWordPacer() {
  let last = Number.NEGATIVE_INFINITY;
  return {
    allow(atMs: number, gapMs: number): boolean {
      if (atMs - last < gapMs) return false;
      last = atMs;
      return true;
    },
  };
}

/** What the needle is on, from the same reading the live voices play. */
export interface NeedleReading {
  lon: number;
  oceanC: number | null;
  rainMm: number | null;
  phase: RainPhase;
}

// A live drop carries the longitude of the reading that made it. The legend's drops are centred and a sweep's are
// where the sweep is, so they don't count as sounding at the needle.
const NEEDLE_LON_TOLERANCE_DEG = 2;

/**
 * The word for an engine event, if that event is a sound playing at the needle: a rain drop or snow bell (the engine
 * emits one per drop), or the ocean tone's value caption (the tone is continuous and has no drop of its own; the
 * engine only captions it while it sounds).
 */
export function needleSoundWord(e: AudioEvent, needle: NeedleReading, audible: (voice: LiveVoiceId) => boolean): SoundWordId | null {
  if (e.kind === "drop") {
    if (!audible(e.voice) || Math.abs(e.lon - needle.lon) > NEEDLE_LON_TOLERANCE_DEG) return null;
    if (e.voice === "snow") return needle.phase === "frozen" ? "snow" : null;
    return needle.phase === "liquid" && needle.rainMm ? soundWordFor("rain", needle.rainMm) : null;
  }
  if (e.kind === "caption" && e.key === "caption.value" && e.params.track === "ocean" && typeof e.params.value === "number") {
    return audible("ocean") && needle.oceanC !== null ? soundWordFor("ocean", e.params.value) : null;
  }
  return null;
}

/** The word for one step of a voice's audio legend, from mapping.json's value for the label being played. */
export function legendSoundWord(voice: LiveVoiceId, label: string | number): SoundWordId | null {
  const point = voiceSpec(voice).legend.find((p) => p.label === label);
  return point ? soundWordFor(voice, point.value) : null;
}
