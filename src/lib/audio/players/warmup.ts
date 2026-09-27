// The warm-up (TEAM_BUILD_PLAN A4, AUDIO_RESEARCH A5/C3): a steady tone to set
// a comfortable volume, then the ocean, rain and snow legends, then one
// no-data tick after a moment of silence. About 21 s; Esc stops it any time.

import { emitCaption } from "../captions";
import { playEarcon } from "../earcons";
import { liveVoices } from "../live";
import { voiceSpec } from "../mapping";
import type { PlayerHandle } from "../types";
import type { ContinuousMapping } from "@/types/data-contract";
import { legendSteps } from "./legend";
import { playSequence, type SequenceStep } from "./sequence";

const VOLUME_CHECK_SEC = 3;
const SECTION_GAP_SEC = 0.8;
const SILENCE_BEFORE_TICK_SEC = 1;
const AFTER_TICK_SEC = 0.5;

/** The middle of the ocean rule: a comfortable mid pitch for the volume check. */
function midOceanValue(): number {
  const { min, max } = (voiceSpec("ocean").mapping as ContinuousMapping).input;
  return (min + max) / 2;
}

export function playWarmup(): PlayerHandle {
  const steps: SequenceStep[] = [
    { at: 0, run: () => liveVoices()?.ocean.set(midOceanValue(), 0) },
    { at: VOLUME_CHECK_SEC, run: () => liveVoices()?.ocean.set(null, 0) },
  ];
  let t = VOLUME_CHECK_SEC + SECTION_GAP_SEC;
  for (const voice of ["ocean", "rain", "snow"] as const) {
    const part = legendSteps(voice, t);
    steps.push(...part.steps);
    t = part.end + SECTION_GAP_SEC;
  }
  t += SILENCE_BEFORE_TICK_SEC;
  steps.push({ at: t, run: () => playEarcon("nodata") });

  return playSequence({
    id: "warmup",
    steps,
    durationSec: t + AFTER_TICK_SEC,
    holdLive: true,
    liftTrackGate: true,
    onStart: () => emitCaption("caption.warmup.start"),
    onEnd: () => emitCaption("caption.warmup.end"),
  });
}
