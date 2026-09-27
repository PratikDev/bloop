// Then vs Now, Comparison Player and single-series playback
// (docs/L2/BUILD_PLAN.md §8.3–8.4; playSeries is proposal B6).
// Step events count data points only, so a chart playhead maps index → point.

import { emitCaption } from "./events";
import { getGraph, type Graph } from "./graph";
import { finishedHandle, playSequence, type Step } from "./sequence";
import type { CompareSide, ContextVoice, PlayerHandle, ThenNowInput, ThenNowPart, WindowSeries } from "./types";
import { createBassVoice, type BassVoice } from "./voices/bass";
import { createHeatVoice, type HeatVoice } from "./voices/heat";
import { createMonsoonVoice, type MonsoonVoice } from "./voices/monsoon";

const YEAR_STEP_SEC = 0.4;
const MONTH_STEP_SEC = 0.06;
const WINDOW_GAP_SEC = 0.8;
const PART_GAP_SEC = 1;
const SERIES_STEP_MS: Record<ContextVoice, number> = { heat: 150, monsoon: 150, water: 60 };

type Pan = "center" | "left" | "right";
interface ContextVoices {
  heat: HeatVoice;
  monsoon: MonsoonVoice;
  water: BassVoice;
}

// Built once per position and reused (their oscillators run silently between uses).
const voiceSets = new Map<Pan, ContextVoices>();

function voicesAt(graph: Graph, pan: Pan): ContextVoices {
  const existing = voiceSets.get(pan);
  if (existing) return existing;
  const panner = new StereoPannerNode(graph.ctx, { pan: pan === "left" ? -1 : pan === "right" ? 1 : 0 });
  panner.connect(graph.context);
  const set = { heat: createHeatVoice(graph, panner), monsoon: createMonsoonVoice(graph, panner), water: createBassVoice(graph, panner) };
  voiceSets.set(pan, set);
  return set;
}

/** One value on one context voice. */
function sound(set: ContextVoices, voice: ContextVoice, time: number, value: number | null, stepSec: number) {
  if (voice === "heat") set.heat.at(time, value);
  else if (voice === "monsoon") set.monsoon.at(time, value, stepSec);
  else set.water.at(time, value);
}

function silence(set: ContextVoices, voice: ContextVoice, durationSec: number): Step {
  return { durationSec, eventIndex: null, run: (time) => sound(set, voice, time, null, durationSec) };
}

/** Silences every Then vs Now voice (used when a player is stopped early). */
function silenceAllSets(time: number) {
  for (const set of voiceSets.values()) {
    set.heat.at(time, null);
    set.water.at(time, null);
    set.monsoon.cancel(time);
  }
}

const caption = (key: string, params: Record<string, string | number> = {}) => () => emitCaption(key, params);

// ---------------------------------------------------------------------------
// Then vs Now
// ---------------------------------------------------------------------------

function windowSteps(set: ContextVoices, voice: ContextVoice, w: WindowSeries, offset: number, player: string): Step[] {
  return w.values.map((v, i) => ({
    durationSec: YEAR_STEP_SEC,
    eventIndex: offset + i,
    player,
    run(time) {
      if (i === 0) caption("caption.thenNow.window", { label: w.label })();
      sound(set, voice, time, v, YEAR_STEP_SEC);
    },
  }));
}

/** Runs `lead` (a caption) just before the first step. */
function withLead(steps: Step[], lead: () => void): Step[] {
  const [first, ...rest] = steps;
  if (!first) return steps;
  return [{ ...first, run: (time, voices, graph) => (lead(), first.run(time, voices, graph)) }, ...rest];
}

function yearlyPart(set: ContextVoices, voice: "heat" | "monsoon", pair: { A: WindowSeries; B: WindowSeries }, text: string): Step[] {
  const player = `thenNow.${voice}`;
  const steps = [
    ...windowSteps(set, voice, pair.A, 0, player),
    silence(set, voice, WINDOW_GAP_SEC),
    ...windowSteps(set, voice, pair.B, pair.A.values.length, player),
    silence(set, voice, 0.2),
  ];
  return withLead(steps, caption("caption.thenNow.caption", { text }));
}

function waterPart(set: ContextVoices, water: ThenNowInput["water"], text: string): Step[] {
  set.water.prepare(water.cm);
  const edges = new Map<string, string>([
    [water.windowA[0], "caption.water.windowStart"],
    [water.windowA[1], "caption.water.windowEnd"],
    [water.windowB[0], "caption.water.windowStart"],
    [water.windowB[1], "caption.water.windowEnd"],
  ]);
  const steps: Step[] = water.months.map((month, i) => ({
    durationSec: MONTH_STEP_SEC,
    eventIndex: i,
    player: "thenNow.water",
    run(time) {
      const cm = water.cm[i];
      // One caption per run of missing months, naming the months.
      if (cm === null && (i === 0 || water.cm[i - 1] !== null)) {
        let end = i;
        while (end + 1 < water.cm.length && water.cm[end + 1] === null) end++;
        emitCaption("caption.water.gap", { from: month, to: water.months[end] });
      }
      const edge = edges.get(month);
      if (edge) emitCaption(edge, { month });
      set.water.at(time, cm);
    },
  }));
  return withLead([...steps, silence(set, "water", 0.2)], caption("caption.thenNow.caption", { text }));
}

export function playThenNow(input: ThenNowInput, part: ThenNowPart): PlayerHandle {
  const graph = getGraph();
  if (!graph) return finishedHandle();
  const set = voicesAt(graph, "center");
  const parts: Record<Exclude<ThenNowPart, "all">, () => Step[]> = {
    heat: () => yearlyPart(set, "heat", input.heat, input.captions.heat),
    monsoon: () => yearlyPart(set, "monsoon", input.monsoon, input.captions.monsoon),
    water: () => waterPart(set, input.water, input.captions.water),
  };
  const steps =
    part === "all"
      ? [
          ...parts.heat(),
          silence(set, "heat", PART_GAP_SEC),
          ...parts.monsoon(),
          silence(set, "monsoon", PART_GAP_SEC),
          ...parts.water(),
        ]
      : parts[part]();
  return playSequence(steps, { name: `thenNow.${part}`, onEnd: caption("caption.thenNow.end"), onStop: silenceAllSets });
}

// ---------------------------------------------------------------------------
// Comparison Player (B1) and single series
// ---------------------------------------------------------------------------

function sideSteps(set: ContextVoices, side: CompareSide, stepSec: number, offset: number, player: string): Step[] {
  return side.values.map((v, i) => ({
    durationSec: stepSec,
    eventIndex: offset + i,
    player,
    run(time) {
      if (i === 0) emitCaption("caption.compare.side", { label: side.label });
      sound(set, side.voice, time, v, stepSec);
    },
  }));
}

export function playCompare(a: CompareSide, b: CompareSide, mode: "sequential" | "split"): PlayerHandle {
  const graph = getGraph();
  if (!graph) return finishedHandle();
  const stepSec = (a.voice === "water" ? MONTH_STEP_SEC : YEAR_STEP_SEC);
  if (mode === "sequential") {
    const set = voicesAt(graph, "center");
    if (a.voice === "water") set.water.prepare([...a.values, ...b.values]);
    return playSequence(
      [...sideSteps(set, a, stepSec, 0, "compare"), silence(set, a.voice, WINDOW_GAP_SEC), ...sideSteps(set, b, stepSec, a.values.length, "compare"), silence(set, b.voice, 0.2)],
      { name: "compare", eventTotal: a.values.length + b.values.length, onStop: silenceAllSets },
    );
  }
  // Split: A in the left ear, B in the right, at the same time.
  const left = voicesAt(graph, "left");
  const right = voicesAt(graph, "right");
  if (a.voice === "water") {
    left.water.prepare([...a.values, ...b.values]);
    right.water.prepare([...a.values, ...b.values]);
  }
  const n = Math.max(a.values.length, b.values.length);
  const steps: Step[] = Array.from({ length: n }, (_, i) => ({
    durationSec: stepSec,
    eventIndex: i,
    run(time) {
      if (i === 0) emitCaption("caption.compare.useHeadphones", { a: a.label, b: b.label });
      sound(left, a.voice, time, a.values[i] ?? null, stepSec);
      sound(right, b.voice, time, b.values[i] ?? null, stepSec);
    },
  }));
  steps.push({ durationSec: 0.2, eventIndex: null, run: (time) => (sound(left, a.voice, time, null, 0.2), sound(right, b.voice, time, null, 0.2)) });
  return playSequence(steps, { name: "compare.split", eventTotal: n, onStop: silenceAllSets });
}

export function playSeries(side: CompareSide, opts?: { stepMs?: number; player?: string }): PlayerHandle {
  const graph = getGraph();
  if (!graph) return finishedHandle();
  const set = voicesAt(graph, "center");
  const stepSec = (opts?.stepMs ?? SERIES_STEP_MS[side.voice]) / 1000;
  if (side.voice === "water") set.water.prepare(side.values);
  const player = opts?.player ?? "series";
  return playSequence([...sideSteps(set, side, stepSec, 0, player), silence(set, side.voice, 0.2)], {
    name: player,
    eventTotal: side.values.length,
    onStop: silenceAllSets,
  });
}
