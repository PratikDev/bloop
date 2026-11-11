// Starts the timed text of a sweep or a time-lapse that has just begun playing. The
// tracks are built once the gazetteer answers (a fraction of a second when it is loaded); cues the playhead has
// already passed then show at once, so nothing is skipped.
import { SWEEP_STEP_MS, TIMELAPSE_FPS } from "@/lib/data";
import { startTimedRun } from "@/lib/timed-text/live";
import { sweepTracks, type SweepRun } from "@/lib/timed-text/sweep";
import { timelapseTracks, type TimelapseRun } from "@/lib/timed-text/timelapse";
import { timedRun } from "./build";

const MS_PER_SEC = 1000;
export const SWEEP_STEP_SEC = SWEEP_STEP_MS / MS_PER_SEC;
export const TIMELAPSE_STEP_SEC = 1 / TIMELAPSE_FPS;

export function followSweep(run: Omit<SweepRun, "stepSec">): void {
  void timedRun("sweep", SWEEP_STEP_SEC, (x) => sweepTracks({ ...run, stepSec: SWEEP_STEP_SEC }, x)).then(startTimedRun);
}

export function followTimelapse(run: Omit<TimelapseRun, "stepSec">): void {
  void timedRun("timelapse", TIMELAPSE_STEP_SEC, (x) => timelapseTracks({ ...run, stepSec: TIMELAPSE_STEP_SEC }, x)).then(startTimedRun);
}
