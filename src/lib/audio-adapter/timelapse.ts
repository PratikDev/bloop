// Storm time-lapse (docs/L2/BUILD_PLAN.md Phase 6): one step per frame at
// `fps`; each step sets rain or snow with the same rules as live rain.
// No-data frames are silent with one tick per run; dry frames are silent.
// Captions only at the start, at the heaviest frame and at the end.

import { peakIndex } from "@/lib/data/storm";
import { playEarconAt } from "./earcons";
import { emitCaption } from "./events";
import { routeRain } from "./live";
import { playSequence, type Step } from "./sequence";
import type { PlayerHandle, SweepPoint } from "./types";

const DEFAULT_FPS = 2;
export const TIMELAPSE_PLAYER = "timelapse";

export function playTimelapse(frames: SweepPoint[], opts?: { fps?: number; loop?: boolean }): PlayerHandle {
  const stepSec = 1 / (opts?.fps ?? DEFAULT_FPS);
  const peak = peakIndex(frames);
  const steps: Step[] = frames.map((f, i) => ({
    durationSec: stepSec,
    player: TIMELAPSE_PLAYER,
    run(time, voices, graph) {
      routeRain(voices, f, time);
      voices.ocean.at(time, null, 0);
      const prev = frames[i - 1];
      if (f.phase === "nodata" && (!prev || prev.phase !== "nodata")) playEarconAt(graph, "nodata", time, f.lon);
      if (i === peak && f.mmPerHour !== null) {
        emitCaption("caption.timelapse.peak", { value: f.mmPerHour, phase: f.phase });
      }
    },
  }));
  // A short silent tail so the last frame is heard in full.
  steps.push({ durationSec: 0.2, eventIndex: null, run: (time, voices) => routeRain(voices, { ...frames[0], mmPerHour: null, phase: "dry" }, time) });
  return playSequence(steps, {
    name: TIMELAPSE_PLAYER,
    eventTotal: frames.length,
    liftTrackGate: true, // it's a rain feature: heard whatever the track, mute and solo still apply
    onStart: () => emitCaption("caption.timelapse.start", { count: frames.length }),
    onEnd: () => emitCaption("caption.timelapse.end"),
  });
}
