// The one place that decides which sound engine the app uses. Components import
// `audio` from here and never import an engine directly.
//
// To switch to L2's real engine (docs/L3/integration.md):
//   import * as l2 from "@/lib/audio";
//   export const audio: AudioEngine = withFallbacks(l2);
//   export const IS_INTERIM_ENGINE = false;
// If L2's API drifts from L2AudioApi, that line fails the type check, so a
// mismatch shows up in `bun run build`, not in front of an audience.

import { withFallbacks } from "./fallbacks";
import { interimEngine } from "./interim-engine";
import type { AudioEngine, AudioEvent } from "./types";

export const audio: AudioEngine = withFallbacks(interimEngine);
export const IS_INTERIM_ENGINE = true;

const audioClock = () => audio.getAnalyser()?.context.currentTime ?? null;

/** Seconds on the audio clock; a local clock if the engine exposes no analyser. */
export function clockNow(): number {
  return audioClock() ?? performance.now() / 1000;
}

/** When to show a timed event: its audio time, or on arrival if there is no audio clock. */
export function eventClockTime(e: Extract<AudioEvent, { time: number }>): number {
  return audioClock() === null ? clockNow() : e.time;
}

export type * from "./types";
