// Then vs Now (TEAM_BUILD_PLAN §11.5, the killer demo): heat pitch with the
// Anomaly Choir, monsoon drop density and the GRACE water bass, each played
// from the demo's own numbers. Captions are the JSON's text as-is (§16).
// Step events count data points only: heat/monsoon 0–19 (window A then B),
// water = month index (BUILD_PLAN §2.1, agreed with L3).

import { emitCaption } from "../captions";
import { missingRuns } from "../context-maths";
import { peekEngine } from "../context";
import type { PlayerHandle, ThenNowInput, ThenNowPart, WindowSeries } from "../types";
import { contextVoices, playValue, silenceContext, type ContextVoices } from "./context-voices";
import { createSequenceSteps, idleHandle, playSequence, type SequenceStepList as StepList } from "./sequence";

export const YEAR_STEP_SEC = 0.4;
export const MONTH_STEP_SEC = 0.06;
export const WINDOW_GAP_SEC = 0.8;
const PART_GAP_SEC = 1;
export const TAIL_SEC = 0.2;

/** heat / monsoon: caption, window A (yearly steps), a gap, window B, then silence. */
function addYearly(list: StepList, set: ContextVoices, voice: "heat" | "monsoon", pair: { A: WindowSeries; B: WindowSeries }, text: string) {
  const player = `thenNow.${voice}`;
  const total = pair.A.values.length + pair.B.values.length;
  const windows = [pair.A, pair.B];
  windows.forEach((w, wi) => {
    const offset = wi === 0 ? 0 : pair.A.values.length;
    w.values.forEach((v, i) => {
      list.add(YEAR_STEP_SEC, {
        event: { player, index: offset + i, total },
        run: (time) => {
          if (wi === 0 && i === 0) emitCaption("caption.thenNow.caption", { text });
          if (i === 0) emitCaption("caption.thenNow.window", { label: w.label });
          playValue(set, voice, v, YEAR_STEP_SEC, time);
        },
      });
    });
    const silenceSec = wi === 0 ? WINDOW_GAP_SEC : TAIL_SEC;
    list.add(silenceSec, { run: (time) => playValue(set, voice, null, silenceSec, time) });
  });
}

/** water: the full monthly record, gap captions per run of missing months, window-edge captions. */
function addWater(list: StepList, set: ContextVoices, water: ThenNowInput["water"], text: string) {
  set.water.prepare(water.cm);
  const edges = new Map<string, string>([
    [water.windowA[0], "caption.water.windowStart"],
    [water.windowA[1], "caption.water.windowEnd"],
    [water.windowB[0], "caption.water.windowStart"],
    [water.windowB[1], "caption.water.windowEnd"],
  ]);
  const gapEnd = new Map(missingRuns(water.cm)); // first missing index → last
  const total = water.months.length;
  water.months.forEach((month, i) => {
    const cm = water.cm[i];
    list.add(MONTH_STEP_SEC, {
      event: { player: "thenNow.water", index: i, total },
      run: (time) => {
        if (i === 0) emitCaption("caption.thenNow.caption", { text });
        const last = gapEnd.get(i);
        if (last !== undefined) emitCaption("caption.water.gap", { from: month, to: water.months[last] });
        const edge = edges.get(month);
        if (edge) emitCaption(edge, { month });
        set.water.set(cm, { time });
      },
    });
  });
  list.add(TAIL_SEC, { run: (time) => set.water.set(null, { time }) });
}

export function playThenNow(input: ThenNowInput, part: ThenNowPart): PlayerHandle {
  if (!peekEngine()) return idleHandle();
  const set = contextVoices("center");
  const list = createSequenceSteps();
  const parts = {
    heat: () => addYearly(list, set, "heat", input.heat, input.captions.heat),
    monsoon: () => addYearly(list, set, "monsoon", input.monsoon, input.captions.monsoon),
    water: () => addWater(list, set, input.water, input.captions.water),
  };
  if (part === "all") {
    parts.heat();
    list.gap(PART_GAP_SEC);
    parts.monsoon();
    list.gap(PART_GAP_SEC);
    parts.water();
  } else {
    parts[part]();
  }
  return playSequence({
    id: `thenNow.${part}`,
    steps: list.steps,
    durationSec: list.end,
    holdLive: true,
    onEnd: () => emitCaption("caption.thenNow.end"),
    onFinish: silenceContext,
  });
}
