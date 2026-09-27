// A sequence: timed steps on the shared scheduler (legend, warm-up; later the
// sweep, motif and opening). Only one sequence plays at a time; starting one
// replaces the last. A sequence can borrow the live voices (holdLive) and
// lift the track gate so the voices it names are heard whatever the track mode.
//
// Phase 3 runs each step when the scheduler hands it over (up to the
// look-ahead early). Phase 4 adds playhead events and exact-time voice changes.

import { getCtx, peekEngine } from "../context";
import { holdLive, releaseLive } from "../live";
import { setTrackGateLifted } from "../mixer";
import { cancel, schedule } from "../scheduler";
import { onStopAll } from "../stop";
import type { PlayerHandle } from "../types";

export interface SequenceStep {
  at: number; // seconds after the sequence starts
  run: () => void;
}

export interface SequenceOptions {
  id: string; // e.g. "legend.ocean"; used as the scheduler owner
  steps: SequenceStep[];
  durationSec: number;
  holdLive?: boolean; // borrow the live voices (exploration pauses, then resumes)
  liftTrackGate?: boolean; // play named voices whatever the track mode
  onStart?: () => void;
  onEnd?: () => void; // only when it plays to the end, not when stopped
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
      if (current === run) current = null;
      if (completed) opts.onEnd?.();
      resolveDone();
    },
  };
  current = run;

  if (opts.holdLive) holdLive();
  if (opts.liftTrackGate) setTrackGateLifted(true);
  opts.onStart?.();

  const start = getCtx().currentTime + LEAD_IN_SEC;
  for (const step of opts.steps) schedule(start + step.at, owner, () => step.run());
  schedule(start + opts.durationSec, owner, () => run.finish(true, true));

  return { stop: () => run.finish(false, true), done };
}
