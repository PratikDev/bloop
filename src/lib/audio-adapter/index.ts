// The one place that decides which sound engine the app uses. Components import
// `audio` from here and never import an engine directly.
//
// To switch to L2's real engine: wrap `@/lib/audio` in an AudioEngine (it needs
// getAnalyser() and drop events, contract-proposals.md §B), import it here
// instead of interimEngine, and set IS_INTERIM_ENGINE to false.

import { interimEngine } from "./interim-engine";
import type { AudioEngine } from "./types";

export const audio: AudioEngine = interimEngine;
export const IS_INTERIM_ENGINE = true;

export type * from "./types";
