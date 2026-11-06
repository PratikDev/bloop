// Ear test T7 (how many voices at once): plays a chosen set of ocean, rain,
// water and heat together for a few seconds, each through its real voice and
// mixer channel, gently moving like data. The listener then says which voices
// were playing. Dev harness only; not part of the public API.

import { liveVoices } from "./live";
import { contextVoices, silenceContext } from "./players/context-voices";
import { playSequence, type SequenceStep } from "./players/sequence";
import type { PlayerHandle } from "./types";

export const T7_VOICES = ["ocean", "rain", "water", "heat"] as const;
export type T7Voice = (typeof T7_VOICES)[number];

const DURATION_SEC = 6;
const STEP_SEC = 0.5;

// Plausible values for each voice (°C, mm/h, cm, °C anomaly): a slow walk inside these.
const RANGES: Record<T7Voice, [number, number]> = {
  ocean: [10, 30],
  rain: [2, 20],
  water: [-20, 20],
  heat: [-0.5, 2],
};

function walk([min, max]: [number, number], steps: number): number[] {
  const out: number[] = [];
  let v = min + Math.random() * (max - min);
  for (let i = 0; i < steps; i++) {
    v = Math.min(max, Math.max(min, v + (Math.random() - 0.5) * 0.2 * (max - min)));
    out.push(v);
  }
  return out;
}

function sound(voice: T7Voice, value: number | null, time: number) {
  const centre = contextVoices("center");
  if (voice === "heat") centre.heat.set(value, { time });
  else if (voice === "water") centre.water.set(value, { time });
  else if (voice === "rain") liveVoices()?.rain.set(value, 0, { time });
  else liveVoices()?.ocean.set(value, 0, { time });
}

/** Plays `voices` together for 6 s. Esc stops it. */
export function playT7(voices: readonly T7Voice[]): PlayerHandle {
  const count = Math.round(DURATION_SEC / STEP_SEC);
  contextVoices("center").water.prepare(RANGES.water);
  const steps: SequenceStep[] = voices.flatMap((voice) => [
    ...walk(RANGES[voice], count).map((value, i) => ({ at: i * STEP_SEC, run: (t: number) => sound(voice, value, t) })),
    { at: DURATION_SEC, run: (t: number) => sound(voice, null, t) },
  ]);
  return playSequence({
    id: "t7",
    steps,
    durationSec: DURATION_SEC + STEP_SEC, // let the last notes fade
    holdLive: true,
    liftTrackGate: true,
    onFinish: silenceContext,
  });
}
