// The sonic identity (TEAM_BUILD_PLAN C9): four soft notes, one per latitude
// band (60°S–30°S, 30°S–0°, 0°–30°N, 30°N–60°N, south → north), each pitched
// by that band's mean ocean temperature through the ocean rule. A band with no
// ocean data is a rest. The band means come from L3's bandMeans().

import { emitCaption } from "../captions";
import { playTone } from "../earcons";
import { mapVoice } from "../mapping";
import type { PlayerHandle } from "../types";
import { playSequence } from "./sequence";
import { evenSteps } from "./steps";

const NOTE_SEC = 0.35;
const GAP_SEC = 0.05;
const TAIL_SEC = 0.3; // the last note's decay

export function playMotif(bandMeansC: (number | null)[]): PlayerHandle {
  const starts = evenSteps(bandMeansC.length, NOTE_SEC + GAP_SEC);
  const steps = bandMeansC.map((c, i) => ({
    at: starts[i],
    run: (time: number) => {
      const freq = mapVoice("ocean", c);
      if (freq !== null) playTone("motif", freq, time, 0); // null band → rest
    },
  }));
  return playSequence({
    id: "motif",
    steps,
    durationSec: bandMeansC.length * (NOTE_SEC + GAP_SEC) + TAIL_SEC,
    onStart: () => emitCaption("caption.motif"),
  });
}
