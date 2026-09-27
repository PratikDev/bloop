// The shared sequence runner: steps scheduled on the audio clock through the
// look-ahead scheduler. One sequence plays at a time; starting another stops
// the current one.

import { MAPPING } from "@/lib/audio/mapping";
import { emit } from "./events";
import { getGraph, type Graph } from "./graph";
import { getVoices, live, type Voices } from "./live";
import { mixer } from "./mixer";
import { addTask, SCHEDULE_AHEAD_SEC } from "./scheduler";
import type { PlayerHandle } from "./types";

export interface Step {
  durationSec: number;
  // Step events (for playheads) count data points only: undefined = this step's
  // position, null = no event (a silent gap), a number = that data index.
  eventIndex?: number | null;
  player?: string; // overrides the sequence name (e.g. parts of "all")
  run(time: number, voices: Voices, graph: Graph): void;
}

export interface SequenceOptions {
  name: string;
  eventTotal?: number; // data points, when gap steps don't count
  liftTrackGate?: boolean; // play voices the current track mode would mute
  onStart?(time: number, graph: Graph, totalSec: number): void;
  onEnd?(time: number): void;
  onStop?(time: number): void; // silence voices the sequence owns when stopped early
}

const START_DELAY_SEC = 0.05;
export const TAIL_SEC = 0.1;

let current: { stop(restore: boolean): void } | null = null;

export function finishedHandle(): PlayerHandle {
  return { stop() {}, done: Promise.resolve() };
}

/** Fades everything that is sounding to silence in ~50 ms, then re-opens the bus. */
export function fastFade(graph: Graph): void {
  const { ctx, fade } = graph;
  const now = ctx.currentTime;
  const fadeSec = MAPPING.global.stopFadeMs / 1000;
  fade.gain.cancelScheduledValues(now);
  fade.gain.setValueAtTime(fade.gain.value, now);
  fade.gain.linearRampToValueAtTime(0, now + fadeSec);
  // Re-open only after every drop already scheduled ahead has passed.
  fade.gain.setValueAtTime(1, now + fadeSec + SCHEDULE_AHEAD_SEC + 0.1);
}

export function stopCurrentSequence(restore: boolean): void {
  current?.stop(restore);
}

export function playSequence(steps: Step[], opts: SequenceOptions): PlayerHandle {
  const graph = getGraph();
  const voices = getVoices();
  if (!graph || !voices || steps.length === 0) return finishedHandle();
  current?.stop(false);

  let resolveDone: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const totalSec = steps.reduce((sum, s) => sum + s.durationSec, 0);
  let index = 0;
  let nextTime = graph.ctx.currentTime + START_DELAY_SEC;
  let endScheduled = false;
  let finished = false;

  live.setSequenceActive(true, false);
  if (opts.liftTrackGate) mixer.liftTrackGate(true);
  opts.onStart?.(nextTime, graph, totalSec);

  const finish = (restore: boolean) => {
    if (finished) return;
    finished = true;
    removeTask();
    if (opts.liftTrackGate) mixer.liftTrackGate(false);
    live.setSequenceActive(false, restore);
    if (current === handle) current = null;
    resolveDone();
  };

  const removeTask = addTask((until) => {
    while (index < steps.length && nextTime < until) {
      const step = steps[index];
      step.run(nextTime, voices, graph);
      const eventIndex = step.eventIndex === undefined ? index : step.eventIndex;
      if (eventIndex !== null) {
        const total = opts.eventTotal ?? steps.length;
        emit({ kind: "step", player: step.player ?? opts.name, index: eventIndex, total, time: nextTime });
      }
      nextTime += steps[index].durationSec;
      index++;
    }
    if (index < steps.length) return;
    if (!endScheduled && nextTime < until) {
      endScheduled = true;
      opts.onEnd?.(nextTime);
    }
    if (graph.ctx.currentTime >= nextTime + TAIL_SEC) finish(true);
  });

  const handle = {
    stop(restore: boolean) {
      if (finished) return;
      fastFade(graph);
      opts.onStop?.(graph.ctx.currentTime);
      finish(restore);
    },
  };
  current = handle;
  return { stop: () => handle.stop(true), done };
}
