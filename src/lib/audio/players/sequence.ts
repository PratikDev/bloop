// A sequence: timed steps on the shared scheduler (legend, warm-up, sweep,
// motif, opening). Only one sequence plays at a time; starting one replaces
// the last. Each step runs when the scheduler hands it over and receives its
// exact audio-clock time, so voice changes land exactly on time. A sequence
// can borrow the live voices (holdLive) and lift the track gate.
//
// Step events (BUILD_PLAN §2.1, agreed with L3): only steps that play a data
// point emit one; `index` / `total` count data points. Like drop events they
// arrive up to the look-ahead early, carrying `time`.

import { getCtx, peekEngine } from "../context";
import { emit } from "../events";
import { holdLive, releaseLive } from "../live";
import { setTrackGateLifted } from "../mixer";
import { cancel, schedule } from "../scheduler";
import { onStopAll } from "../stop";
import type { PlayerHandle } from "../types";
import { createStepList } from "./steps";

/** A step that plays a data point emits one step event (player, data index, number of data points). */
export interface StepEvent {
  player: string;
  index: number;
  total: number;
}

export interface SequenceStep {
  at: number; // seconds after the sequence starts
  run: (time: number) => void; // `time` = exact audio-clock time of this step
  event?: StepEvent; // only for steps that play a data point
}

/** Builds sequence steps of varying length back to back (see createStepList). */
export const createSequenceSteps = () => createStepList<Omit<SequenceStep, "at">>();
export type SequenceStepList = ReturnType<typeof createSequenceSteps>;

export interface SequenceOptions {
  id: string; // e.g. "legend.ocean"; used as the scheduler owner
  steps: SequenceStep[];
  durationSec: number;
  holdLive?: boolean; // borrow the live voices (exploration pauses, then resumes)
  liftTrackGate?: boolean; // play named voices whatever the track mode
  loop?: boolean; // start again exactly where it ends (no gap) until stopped; onEnd never fires
  onStart?: (startTime: number) => void;
  onEnd?: () => void; // only when it plays to the end, not when stopped
  onFinish?: () => void; // always, after it ends or is stopped (cleanup)
}

/** Lets live voices fade out before the first step. */
const LEAD_IN_SEC = 0.15;

/** A handle for something that never plays (before Start, or nothing to play). */
export function idleHandle(): PlayerHandle {
  return { stop: () => {}, done: Promise.resolve() };
}

let current: { finish: (completed: boolean, resume: boolean) => void } | null = null;
let runs = 0;

// Esc: end the sequence without resuming exploration.
onStopAll(() => current?.finish(false, false));

export function playSequence(opts: SequenceOptions): PlayerHandle {
  if (!peekEngine()) return idleHandle();
  current?.finish(false, false); // replaced: the new sequence takes over

  const owner = `${opts.id}#${++runs}`;
  let finished = false;
  let resolveDone: () => void = () => {};
  const done = new Promise<void>((resolve) => (resolveDone = resolve));

  const run = {
    finish(completed: boolean, resume: boolean) {
      if (finished) return;
      finished = true;
      cancel(owner);
      if (opts.liftTrackGate) setTrackGateLifted(false);
      if (opts.holdLive) releaseLive(resume);
      opts.onFinish?.();
      if (current === run) current = null;
      if (completed) opts.onEnd?.();
      resolveDone();
    },
  };
  current = run;

  if (opts.holdLive) holdLive();
  if (opts.liftTrackGate) setTrackGateLifted(true);
  const start = getCtx().currentTime + LEAD_IN_SEC;
  opts.onStart?.(start);

  const scheduleRound = (roundStart: number) => {
    for (const step of opts.steps) {
      schedule(roundStart + step.at, owner, (time) => {
        step.run(time);
        if (step.event) emit({ kind: "step", ...step.event, time });
      });
    }
    const end = roundStart + opts.durationSec;
    schedule(end, owner, () => (opts.loop ? scheduleRound(end) : run.finish(true, true)));
  };
  scheduleRound(start);

  return { stop: () => run.finish(false, true), done };
}
