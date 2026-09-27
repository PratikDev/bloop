// The gist sweep (TEAM_BUILD_PLAN A6): the live voices play a path of points
// (L3's sweepPath(): rings outward from a centre) one step at a time, exactly
// on the audio clock. Track mode applies as in exploration; entering a
// no-data area plays the soft tick. One step event per point ("sweep").

import { emitCaption } from "../captions";
import { playEarconAt } from "../earcons";
import { liveVoices, NODATA_TICK_GAP_SEC, routeRain } from "../live";
import { isVoiceAudible } from "../mixer";
import { createNoDataTracker } from "../nodata";
import type { PlayerHandle, SweepPoint } from "../types";
import { playSequence } from "./sequence";
import { evenSteps } from "./steps";

const DEFAULT_STEP_MS = 80;
const TAIL_SEC = 0.3; // let the last point ring before handing the voices back

export function playSweep(points: SweepPoint[], opts: { stepMs?: number } = {}): PlayerHandle {
  const stepSec = (opts.stepMs ?? DEFAULT_STEP_MS) / 1000;
  const noData = createNoDataTracker(NODATA_TICK_GAP_SEC);
  const starts = evenSteps(points.length, stepSec);

  const steps = points.map((p, i) => ({
    at: starts[i],
    dataIndex: i,
    run: (time: number) => {
      const v = liveVoices();
      if (!v) return;
      v.ocean.set(p.valueC, p.lon, { time });
      routeRain(v, p.mmPerHour, p.phase, p.lon, { time });
      const ocean = noData.update("ocean", p.valueC === null, time);
      const rain = noData.update("rain", p.phase === "nodata", time);
      const oceanTick = ocean.tick && isVoiceAudible("ocean");
      const rainTick = rain.tick && isVoiceAudible(p.phase === "frozen" ? "snow" : "rain");
      if (oceanTick || rainTick) playEarconAt("nodata", time, p.lon);
    },
  }));

  return playSequence({
    id: "sweep",
    player: "sweep",
    dataTotal: points.length,
    steps,
    durationSec: points.length * stepSec + TAIL_SEC,
    holdLive: true,
    onStart: () => emitCaption("caption.sweep.start"),
    onEnd: () => emitCaption("caption.sweep.end"),
  });
}
