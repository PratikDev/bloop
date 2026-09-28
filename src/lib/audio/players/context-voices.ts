// The Then vs Now voices (heat, monsoon, water), one set per stereo position:
// centre for Then vs Now and series, left / right for the split comparison.
// Each voice feeds its own mixer channel, so mute, solo and mute-all apply
// (unlike L3's interim engine, which skipped the mixer here).

import type { CompareSide } from "../types";
import { createBassVoice, type BassVoice } from "../voices/bass";
import { createVoiceOutput } from "../voices/common";
import { createHeatVoice, type HeatVoice } from "../voices/heat";
import { createMonsoonVoice, type MonsoonVoice } from "../voices/monsoon";

export type ContextVoice = CompareSide["voice"];
export type Side = "center" | "left" | "right";

export interface ContextVoices {
  heat: HeatVoice;
  monsoon: MonsoonVoice;
  water: BassVoice;
}

const PAN: Record<Side, number> = { center: 0, left: -1, right: 1 };

// Built once per position after Start, then reused (they rebuild their own oscillators after Esc).
const sets = new Map<Side, ContextVoices>();

export function contextVoices(side: Side): ContextVoices {
  const existing = sets.get(side);
  if (existing) return existing;
  const pan = PAN[side];
  const set: ContextVoices = {
    heat: createHeatVoice(createVoiceOutput("heat", pan)),
    monsoon: createMonsoonVoice(createVoiceOutput("monsoon", pan)),
    water: createBassVoice(createVoiceOutput("water", pan)),
  };
  sets.set(side, set);
  return set;
}

/** One value on one voice at `time` (null = silence); monsoon spreads its drops over `stepSec`. */
export function playValue(set: ContextVoices, voice: ContextVoice, value: number | null, stepSec: number, time: number) {
  if (voice === "heat") set.heat.set(value, { time });
  else if (voice === "water") set.water.set(value, { time });
  else set.monsoon.step(value, stepSec, time);
}

/** Silences every Then vs Now voice now (a player stopped early). */
export function silenceContext() {
  for (const set of sets.values()) {
    set.heat.set(null);
    set.water.set(null);
    set.monsoon.cancel();
  }
}
