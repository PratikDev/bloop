// Storm time-lapse (TEAM_BUILD_PLAN C4): one step per half-hourly IMERG frame
// at the point that follows the heaviest rain (L3's followStorm()). Each frame
// sets rain or snow with the same rules as live rain; rate changes glide
// (the drop voice's rate timeline), so there are no bursts between frames.
// No-data frames are silent with one tick per run; dry frames are silent.
// Captions only at the start, the heaviest frame and the end (L3 B8).

import { emitCaption } from "../captions";
import { playEarconAt } from "../earcons";
import { liveVoices, NODATA_TICK_GAP_SEC, routeRain } from "../live";
import { isVoiceAudible } from "../mixer";
import { createNoDataTracker } from "../nodata";
import { peakFrame } from "../storm-maths";
import type { PlayerHandle, SweepPoint } from "../types";
import { playSequence, type SequenceStep } from "./sequence";
import { evenSteps } from "./steps";

const DEFAULT_FPS = 2;
const TAIL_SEC = 0.2; // let the last frame ring (not used when looping)
const PLAYER = "timelapse";

export function playTimelapse(frames: SweepPoint[], opts: { fps?: number; loop?: boolean } = {}): PlayerHandle {
  const stepSec = 1 / (opts.fps ?? DEFAULT_FPS);
  const loop = opts.loop ?? false;
  const peak = peakFrame(frames);
  const noData = createNoDataTracker(NODATA_TICK_GAP_SEC);
  const starts = evenSteps(frames.length, stepSec);

  const steps: SequenceStep[] = frames.map((f, i) => ({
    at: starts[i],
    event: { player: PLAYER, index: i, total: frames.length },
    run: (time) => {
      const v = liveVoices();
      if (!v) return;
      routeRain(v, f.mmPerHour, f.phase, f.lon, { time });
      const { tick } = noData.update("rain", f.phase === "nodata", time);
      if (tick && isVoiceAudible("rain")) playEarconAt("nodata", time, f.lon);
      if (i === peak && f.mmPerHour !== null) emitCaption("caption.timelapse.peak", { value: f.mmPerHour, phase: f.phase });
    },
  }));

  const framesSec = frames.length * stepSec;
  if (!loop) {
    steps.push({ at: framesSec, run: (time) => { const v = liveVoices(); if (v) routeRain(v, null, "dry", 0, { time }); } });
  }

  return playSequence({
    id: PLAYER,
    steps,
    durationSec: loop ? framesSec : framesSec + TAIL_SEC,
    loop,
    holdLive: true,
    liftTrackGate: true, // a rain feature: heard whatever the track mode (mute and solo still apply)
    onStart: () => emitCaption("caption.timelapse.start", { count: frames.length }),
    onEnd: () => emitCaption("caption.timelapse.end"),
  });
}
