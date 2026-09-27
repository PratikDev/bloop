// A drop voice: sparse one-shot sounds (rain drops, snow bells) whose average
// rate follows the mapping rule (drops per second), scheduled on the shared
// look-ahead scheduler. Rate changes can be set now or at an exact audio-clock
// time; each drop uses the rate in force at its own time. Each drop emits a
// `drop` event for L3's ripples.

import { getCtx } from "../context";
import { emit } from "../events";
import { mapVoice, normalise, voiceSpec } from "../mapping";
import { isVoiceAudible } from "../mixer";
import { cancel, schedule } from "../scheduler";
import { onStopAll } from "../stop";
import type { ContinuousMapping } from "@/types/data-contract";
import { createVoiceOutput, panTo, voicePeak, type VoiceTiming } from "./common";
import { jitteredInterval, nextDropTime } from "./drop-timing";
import { createTimeline } from "./rate-timeline";

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

const START_DELAY_SEC = 0.02;

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

  const timeline = createTimeline<DropState>(SILENT);
  let pending: number | null = null; // time of the next scheduled drop
  let lastDrop = -Infinity;

  onStopAll(() => {
    timeline.clear();
    pending = null;
  });

  function scheduleNext(time: number) {
    pending = time;
    schedule(time, owner, fall);
  }

  function fall(time: number) {
    pending = null;
    const s = timeline.at(time);
    timeline.prune(time);
    if (s.rate === null) {
      // Silent now; wake up at the next change that starts falling again (if any).
      const next = timeline.nextAfter(time, (v) => v.rate !== null);
      if (next) scheduleNext(next.time);
      return;
    }
    const peak = peakFor(s.t);
    playDrop(time, level * peak, out);
    lastDrop = time;
    if (isVoiceAudible(id)) emit({ kind: "drop", voice: id, time, gain: peak, lon: s.lon });
    scheduleNext(time + jitteredInterval(s.rate));
  }

  return {
    set(mmPerHour, lon, at = {}) {
      const now = getCtx().currentTime;
      const time = Math.max(at.time ?? now, now);
      panTo(panner, lon, at.time);
      const rate = mmPerHour !== null && mmPerHour > 0 ? mapVoice(id, mmPerHour) : null;
      const t = rate === null ? 0 : (normalise(mmPerHour, mapping.input) ?? 0);
      timeline.set(time, { rate, t, lon });
      if (rate === null) return; // drops due after `time` find silence and stop

      const earliest = Math.max(time, now + START_DELAY_SEC);
      if (pending === null) {
        scheduleNext(earliest);
        return;
      }
      // Already falling: move the next drop if the new rate wants it sooner (no burst).
      const sooner = nextDropTime(lastDrop, rate, earliest);
      if (sooner < pending) {
        cancel(owner);
        scheduleNext(sooner);
      }
    },
  };
}
