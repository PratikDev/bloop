// The Jukebox engine (built on bloop-dev before the L2 engine joined the app): the sound of the Official and Related
// records (record voices, OSCAR currents), the Turntable and its scenes (clarity echo, normal tone, spatial rain,
// recorded-data texture) and Unison. Main's pages play through L2 (@/lib/audio-adapter). Both engines share one
// AudioContext (graph.ts), and src/lib/audio-engines.ts makes Mute all, Stop and the hand-off between them reach both.
// Components of those features import `audio` from here, never an engine file directly.

import { withFallbacks } from "./fallbacks";
import { interimEngine } from "./interim-engine";
import type { AudioEngine, AudioEvent } from "./types";

export const audio: AudioEngine = withFallbacks(interimEngine);

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
