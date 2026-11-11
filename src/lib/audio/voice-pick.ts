// PURE: which speech voice to use for a language.

import type { Lang } from "./types";

/** The fields of a speech voice this rule needs (SpeechSynthesisVoice has them). */
export interface VoiceInfo {
  lang: string; // BCP 47, e.g. "en-US", "bn-BD"
  localService: boolean; // true = works offline
}

/** Best voice for a language: a matching language, preferring local (offline) voices. null = none. */
export function pickVoice<V extends VoiceInfo>(voices: readonly V[], lang: Lang): V | null {
  const matching = voices.filter((v) => v.lang.toLowerCase().split(/[-_]/)[0] === lang);
  return matching.find((v) => v.localService) ?? matching[0] ?? null;
}
