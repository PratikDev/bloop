// The warm-up (TEAM_BUILD_PLAN A4, AUDIO_RESEARCH A5/C3): a steady tone to set
// a comfortable volume, then the ocean, rain and snow legends, then one
// no-data tick after a moment of silence. About 22 s; Esc stops it any time.

import { emitCaption } from "../captions";
import { playEarconWithCaption } from "../earcons";
import { liveVoices } from "../live";
import type { PlayerHandle } from "../types";
import { referenceValue } from "../mapping";
import { legendSteps, REFERENCE_SEC } from "./legend";
import { playSequence, type SequenceStep } from "./sequence";

const SECTION_GAP_SEC = 0.8;
const SILENCE_BEFORE_TICK_SEC = 1;
const AFTER_TICK_SEC = 0.5;

export function playWarmup(): PlayerHandle {
  const steps: SequenceStep[] = [
    { at: 0, run: (time) => liveVoices()?.ocean.set(referenceValue(), 0, { time }) },
    { at: REFERENCE_SEC, run: (time) => liveVoices()?.ocean.set(null, 0, { time }) },
  ];
  let t = REFERENCE_SEC + SECTION_GAP_SEC;
  for (const voice of ["ocean", "rain", "snow"] as const) {
    const part = legendSteps(voice, t);
    steps.push(...part.steps);
    t = part.end + SECTION_GAP_SEC;
  }
  t += SILENCE_BEFORE_TICK_SEC;
  steps.push({ at: t, run: (time) => playEarconWithCaption("nodata", time) });

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
