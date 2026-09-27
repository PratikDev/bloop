// A drop voice: sparse one-shot sounds (rain drops, snow bells) whose average
// rate follows the mapping rule (drops per second), scheduled on the shared
// look-ahead scheduler. Each drop emits a `drop` event for L3's ripples.

import { getCtx } from "../context";
import { emit } from "../events";
import { mapVoice, normalise, voiceSpec } from "../mapping";
import { isVoiceAudible } from "../mixer";
import { cancel, schedule } from "../scheduler";
import { onStopAll } from "../stop";
import type { ContinuousMapping } from "@/types/data-contract";
import { createVoiceOutput, panTo, voicePeak } from "./common";
import { jitteredInterval, nextDropTime } from "./drop-timing";

export type DropVoiceId = "rain" | "snow";

/** Plays one drop at `time` with a peak level (0..1 of the voice's level) into `out`. */
export type PlayDrop = (time: number, peak: number, out: AudioNode) => void;

export interface DropVoice {
  /** mm/h (null or 0 = silence) at a longitude (stereo). */
  set(mmPerHour: number | null, lon: number): void;
}

/** Heavier rain is a little louder: peak = 0.6 + 0.4·t (BUILD_PLAN §5.1). */
const peakFor = (t: number) => 0.6 + 0.4 * t;

const START_DELAY_SEC = 0.02;

export function createDropVoice(id: DropVoiceId, playDrop: PlayDrop, makeOutput?: (panner: AudioNode) => AudioNode): DropVoice {
  const owner = `voice.${id}`;
  const mapping = voiceSpec(id).mapping as ContinuousMapping;
  const level = voicePeak(id);
  const panner = createVoiceOutput(id);
  const out = makeOutput ? makeOutput(panner) : panner;

  let rate: number | null = null; // drops per second; null = silent
  let t = 0; // position on the rule, 0..1 (sets loudness)
  let lon = 0;
  let pending: number | null = null; // time of the next scheduled drop
  let lastDrop = -Infinity;

  onStopAll(() => {
    rate = null;
    pending = null;
  });

  function scheduleNext(time: number) {
    pending = time;
    schedule(time, owner, fall);
  }

  function fall(time: number) {
    pending = null;
    if (rate === null) return;
    const peak = peakFor(t);
    playDrop(time, level * peak, out);
    lastDrop = time;
    if (isVoiceAudible(id)) emit({ kind: "drop", voice: id, time, gain: peak, lon });
    scheduleNext(time + jitteredInterval(rate));
  }

  return {
    set(mmPerHour, newLon) {
      lon = newLon;
      panTo(panner, lon);
      const r = mmPerHour !== null && mmPerHour > 0 ? mapVoice(id, mmPerHour) : null;
      if (r === null) {
        rate = null;
        cancel(owner);
        pending = null;
        return;
      }
      t = normalise(mmPerHour, mapping.input) ?? 0;
      const wasSilent = rate === null;
      rate = r;
      const now = getCtx().currentTime;
      if (wasSilent || pending === null) {
        scheduleNext(now + START_DELAY_SEC);
        return;
      }
      // Rate changed while falling: move the next drop if the new rate wants it sooner (no burst).
      const sooner = nextDropTime(lastDrop, r, now + START_DELAY_SEC);
      if (sooner < pending) {
        cancel(owner);
        scheduleNext(sooner);
      }
    },
  };
}
