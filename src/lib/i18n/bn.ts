// Bangla strings. Empty on purpose: every key falls back to English until a
// teammate translates it (list in docs/L3/bangla-strings.md). Plan §16 wording
// must be translated by a person, never by a machine.

import type { Messages } from "./index";

export const bn: Partial<Messages> = {};

/**
 * Set to true once the Bangla strings that are spoken (Enter, Story, Describe)
 * are translated. Until then speech stays English, with Bangla on screen
 * (plan §17: "English narration + Bangla subtitles").
 */
export const BANGLA_SPEECH_READY = false;
