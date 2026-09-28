// The monsoon voice (Then vs Now, TEAM_BUILD_PLAN §10): each step (one year's
// June–September rain, decision D1) plays exactly round(mm/day × 0.6) rain
// drops spread across the step. Each drop goes through the shared scheduler
// under this voice's owner, so stopping cancels the drops still to come.

import { monsoonDrops, stepDropTimes } from "../context-maths";
import { cancel, schedule } from "../scheduler";
import { voicePeak } from "./common";
import { createDropFilter, playNoiseDrop } from "./rain";

const DROP_PEAK = 0.8; // of the voice level; density carries the data, not loudness

let voices = 0;

export interface MonsoonVoice {
  /** One step: mm/day (null = silence) spread over `stepSec` starting at `time`. */
  step(mmPerDay: number | null, stepSec: number, time: number): void;
  /** Cancels drops not yet handed to Web Audio. */
  cancel(): void;
}

export function createMonsoonVoice(output: AudioNode): MonsoonVoice {
  const owner = `voice.monsoon.${++voices}`;
  const filter = createDropFilter(output);
  const peak = voicePeak("monsoon") * DROP_PEAK;

  return {
    step(mmPerDay, stepSec, time) {
      for (const t of stepDropTimes(monsoonDrops(mmPerDay), stepSec, time)) {
        schedule(t, owner, (at) => playNoiseDrop("monsoon", at, peak, filter));
      }
    },
    cancel() {
      cancel(owner);
    },
  };
}
