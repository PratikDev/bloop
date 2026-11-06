// The Comparison Player (TEAM_BUILD_PLAN B1) and single-series playback (L3
// proposal B6, e.g. Place History). Sequential: side A, a gap, side B, one
// voice in the centre. Split: A in the left ear and B in the right at once.
// Water sides share one pitch range so A and B are comparable.

import { emitCaption } from "../captions";
import { peekEngine } from "../context";
import type { CompareSide, PlayerHandle } from "../types";
import { contextVoices, playValue, silenceContext, type ContextVoice, type ContextVoices } from "./context-voices";
import { createSequenceSteps, idleHandle, playSequence, type SequenceStepList as StepList } from "./sequence";
import { MONTH_STEP_SEC, TAIL_SEC, WINDOW_GAP_SEC, YEAR_STEP_SEC } from "./then-now";

/** Compare steps: yearly for heat and monsoon, monthly for water. */
const compareStepSec = (voice: ContextVoice) => (voice === "water" ? MONTH_STEP_SEC : YEAR_STEP_SEC);

/** playSeries default step lengths (agreed with L3 on PR #4). */
const SERIES_STEP_MS: Record<ContextVoice, number> = { heat: 150, monsoon: 150, water: 60 };

/** Steps for one side, its label captioned on the first step; events counted from `offset`. */
function addSide(list: StepList, set: ContextVoices, side: CompareSide, stepSec: number, event: { player: string; offset: number; total: number }) {
  side.values.forEach((v, i) => {
    list.add(stepSec, {
      event: { player: event.player, index: event.offset + i, total: event.total },
      run: (time) => {
        if (i === 0) emitCaption("caption.compare.side", { label: side.label });
        playValue(set, side.voice, v, stepSec, time);
      },
    });
  });
}

function silenceStep(list: StepList, set: ContextVoices, voice: ContextVoice, sec: number) {
  list.add(sec, { run: (time) => playValue(set, voice, null, sec, time) });
}

function play(id: string, list: StepList): PlayerHandle {
  return playSequence({ id, steps: list.steps, durationSec: list.end, holdLive: true, onFinish: silenceContext });
}

export function playCompare(a: CompareSide, b: CompareSide, mode: "sequential" | "split"): PlayerHandle {
  if (!peekEngine()) return idleHandle();
  const stepSec = compareStepSec(a.voice);
  const both = [...a.values, ...b.values];
  const list = createSequenceSteps();

  if (mode === "sequential") {
    const set = contextVoices("center");
    if (a.voice === "water" || b.voice === "water") set.water.prepare(both);
    const total = a.values.length + b.values.length;
    addSide(list, set, a, stepSec, { player: "compare", offset: 0, total });
    silenceStep(list, set, a.voice, WINDOW_GAP_SEC);
    addSide(list, set, b, stepSec, { player: "compare", offset: a.values.length, total });
    silenceStep(list, set, b.voice, TAIL_SEC);
    return play("compare", list);
  }

  const left = contextVoices("left");
  const right = contextVoices("right");
  for (const set of [left, right]) set.water.prepare(both);
  const n = Math.max(a.values.length, b.values.length);
  for (let i = 0; i < n; i++) {
    list.add(stepSec, {
      event: { player: "compare.split", index: i, total: n },
      run: (time) => {
        if (i === 0) emitCaption("caption.compare.useHeadphones", { a: a.label, b: b.label });
        playValue(left, a.voice, a.values[i] ?? null, stepSec, time);
        playValue(right, b.voice, b.values[i] ?? null, stepSec, time);
      },
    });
  }
  list.add(TAIL_SEC, {
    run: (time) => {
      playValue(left, a.voice, null, TAIL_SEC, time);
      playValue(right, b.voice, null, TAIL_SEC, time);
    },
  });
  return play("compare.split", list);
}

/** One series on its own (e.g. a decade of Place History); step events under `player`. */
export function playSeries(side: CompareSide, opts: { stepMs?: number; player?: string } = {}): PlayerHandle {
  if (!peekEngine()) return idleHandle();
  const set = contextVoices("center");
  const stepSec = (opts.stepMs ?? SERIES_STEP_MS[side.voice]) / 1000;
  const player = opts.player ?? "series";
  if (side.voice === "water") set.water.prepare(side.values);
  const list = createSequenceSteps();
  addSide(list, set, side, stepSec, { player, offset: 0, total: side.values.length });
  silenceStep(list, set, side.voice, TAIL_SEC);
  return play(player, list);
}
