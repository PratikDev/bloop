// A drop voice: sparse one-shot sounds (rain drops, snow bells) whose average
// rate follows the mapping rule (drops per second). The timing lives in the
// pure drop clock (drop-clock.ts: jitter drawn once per drop, rate changes
// re-time the same interval); this file turns it into scheduled sounds on the
// shared scheduler. Each drop emits a `drop` event for L3's ripples.

import { getCtx } from "../context";
import { emit } from "../events";
import { mapVoice, normalise, voiceSpec } from "../mapping";
import { isVoiceAudible } from "../mixer";
import { cancel, schedule } from "../scheduler";
import { onStopAll } from "../stop";
import type { ContinuousMapping } from "@/types/data-contract";
import { createVoiceOutput, panTo, voicePeak, type VoiceTiming } from "./common";
import { createDropClock } from "./drop-clock";

export type DropVoiceId = "rain" | "snow";

/** Plays one drop at `time` with a peak level (0..1 of the voice's level) into `out`. */
export type PlayDrop = (time: number, peak: number, out: AudioNode) => void;

export interface DropVoice {
  /** mm/h (null or 0 = silence) at a longitude (stereo), now or at `at.time`. */
  set(mmPerHour: number | null, lon: number, at?: VoiceTiming): void;
}

interface DropState {
  rate: number | null; // drops per second; null = silent
  t: number; // position on the rule, 0..1 (sets loudness)
  lon: number;
}

const SILENT: DropState = { rate: null, t: 0, lon: 0 };

/** Heavier rain is a little louder: peak = 0.6 + 0.4·t (BUILD_PLAN §5.1). */
const peakFor = (t: number) => 0.6 + 0.4 * t;

export function createDropVoice(
  id: DropVoiceId,
  playDrop: PlayDrop,
  makeOutput?: (panner: AudioNode) => AudioNode,
): DropVoice {
  const owner = `voice.${id}`;
  const mapping = voiceSpec(id).mapping as ContinuousMapping;
  const level = voicePeak(id);
  const panner = createVoiceOutput(id);
  const out = makeOutput ? makeOutput(panner) : panner;
  const clock = createDropClock<DropState>(SILENT, (s) => s.rate);
  let scheduled: number | null = null; // the drop time currently on the scheduler

  onStopAll(() => {
    clock.reset();
    scheduled = null;
  });

  /** Keeps exactly one scheduled drop, at the clock's pending time. */
  function sync() {
    const next = clock.pending;
    if (next === scheduled) return;
    if (scheduled !== null) cancel(owner);
    scheduled = next;
    if (next !== null) schedule(next, owner, fall);
  }

  function fall(time: number) {
    scheduled = null;
    const { value } = clock.fall(time);
    if (value) {
      const peak = peakFor(value.t);
      playDrop(time, level * peak, out);
      if (isVoiceAudible(id)) emit({ kind: "drop", voice: id, time, gain: peak, lon: value.lon });
    }
    sync();
  }

  return {
    set(mmPerHour, lon, at = {}) {
      const now = getCtx().currentTime;
      panTo(panner, lon, at.time);
      const rate = mmPerHour !== null && mmPerHour > 0 ? mapVoice(id, mmPerHour) : null;
      const t = rate === null ? 0 : (normalise(mmPerHour, mapping.input) ?? 0);
      clock.set(Math.max(at.time ?? now, now), { rate, t, lon }, now);
      sync();
    },
  };
}
