// Sequences scheduled on the audio clock: sweep, legend, warm-up, motif, opening.
// One sequence plays at a time; starting another stops the current one.

import { MAPPING, mapVoice, voiceSpec } from "@/lib/audio/mapping";
import { playEarconAt, playTone } from "./earcons";
import { emit, emitCaption } from "./events";
import { getGraph, type Graph } from "./graph";
import { getVoices, live, routeRain, type Voices } from "./live";
import { mixer } from "./mixer";
import { addTask, SCHEDULE_AHEAD_SEC } from "./scheduler";
import type { LegendVoice, PlayerHandle, SweepPoint } from "./types";

interface Step {
  durationSec: number;
  run(time: number, voices: Voices, graph: Graph): void;
}

interface SequenceOptions {
  name: string;
  liftTrackGate?: boolean; // play voices the current track mode would mute
  onStart?(time: number, graph: Graph, totalSec: number): void;
  onEnd?(time: number): void;
}

const START_DELAY_SEC = 0.05;
const TAIL_SEC = 0.1;

let current: { stop(restore: boolean): void } | null = null;

function finishedHandle(): PlayerHandle {
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

function playSequence(steps: Step[], opts: SequenceOptions): PlayerHandle {
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
      steps[index].run(nextTime, voices, graph);
      emit({ kind: "step", player: opts.name, index, total: steps.length, time: nextTime });
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
      finish(restore);
    },
  };
  current = handle;
  return { stop: () => handle.stop(true), done };
}

// ---------------------------------------------------------------------------
// Sweep: each point drives the voices (respecting the track mode).
// ---------------------------------------------------------------------------

function pointSteps(points: SweepPoint[], stepSec: number, oceanGlideSec?: number): Step[] {
  return points.map((p, i) => ({
    durationSec: stepSec,
    run(time, voices, graph) {
      voices.ocean.at(time, p.valueC, p.lon, oceanGlideSec);
      routeRain(voices, p, time);
      const prev = points[i - 1];
      if (prev && prev.valueC !== null && p.valueC === null && mixer.isAudible("ocean")) {
        playEarconAt(graph, "nodata", time, p.lon);
      }
    },
  }));
}

export function playSweep(points: SweepPoint[], opts?: { stepMs?: number }): PlayerHandle {
  return playSequence(pointSteps(points, (opts?.stepMs ?? 80) / 1000), {
    name: "sweep",
    onStart: () => emitCaption("caption.sweep.start"),
    onEnd: () => emitCaption("caption.sweep.end"),
  });
}

// ---------------------------------------------------------------------------
// Legend and warm-up: reference values from mapping.json.
// ---------------------------------------------------------------------------

const LEGEND_TONE_SEC = 1.0;
const LEGEND_DROPS_SEC = 1.6;
const LEGEND_GAP_SEC = 0.35;
const LIVE_LEGENDS = ["ocean", "rain", "snow"] as const;
type LiveLegend = (typeof LIVE_LEGENDS)[number];

function isLiveLegend(v: LegendVoice): v is LiveLegend {
  return (LIVE_LEGENDS as readonly LegendVoice[]).includes(v);
}

function legendSteps(voice: LiveLegend): Step[] {
  const holdSec = voice === "ocean" ? LEGEND_TONE_SEC : LEGEND_DROPS_SEC;
  return voiceSpec(voice).legend.flatMap((point): Step[] => [
    {
      durationSec: holdSec,
      run(time, voices) {
        if (voice === "ocean") voices.ocean.at(time, point.value, 0);
        else voices[voice].at(time, point.value, 0);
        emitCaption("caption.legend", { voice, label: point.label });
      },
    },
    {
      durationSec: LEGEND_GAP_SEC,
      run(time, voices) {
        if (voice === "ocean") voices.ocean.at(time, null, 0);
        else voices[voice].at(time, null, 0);
      },
    },
  ]);
}

export function playLegend(voice: LegendVoice): PlayerHandle {
  if (!isLiveLegend(voice)) {
    emitCaption("caption.legendUnavailable", { voice });
    return finishedHandle();
  }
  return playSequence(legendSteps(voice), { name: `legend.${voice}`, liftTrackGate: true });
}

export function playWarmup(): PlayerHandle {
  return playSequence(LIVE_LEGENDS.flatMap(legendSteps), {
    name: "warmup",
    liftTrackGate: true,
    onStart: () => emitCaption("caption.warmup.start"),
    onEnd: () => emitCaption("caption.warmup.end"),
  });
}

// ---------------------------------------------------------------------------
// Motif (sonic identity): four latitude-band means, ocean rule, bell timbre.
// ---------------------------------------------------------------------------

const MOTIF_NOTE_SEC = 0.35;
const MOTIF_GAP_SEC = 0.05;

export function playMotif(bandMeansC: (number | null)[]): PlayerHandle {
  const s = voiceSpec("motif").sound;
  return playSequence(
    bandMeansC.map((mean) => ({
      durationSec: MOTIF_NOTE_SEC + MOTIF_GAP_SEC,
      run(time, _voices, graph) {
        const freq = mapVoice("ocean", mean);
        if (freq === null) return; // no ocean data in this band: a rest
        playTone(graph, { time, freq, peak: s.maxGain, attackSec: s.attackMs / 1000, releaseSec: s.releaseMs / 1000 });
      },
    })),
    { name: "motif", onStart: () => emitCaption("caption.motif") },
  );
}

// ---------------------------------------------------------------------------
// Opening (C1): ~10 s of real ocean and rain with long glides, fading in and out.
// ---------------------------------------------------------------------------

const OPENING_FADE_IN_SEC = 2;
const OPENING_FADE_OUT_SEC = 1.5;

export function playOpening(points: SweepPoint[], opts?: { durationSec?: number }): PlayerHandle {
  const durationSec = opts?.durationSec ?? 10;
  const stepSec = durationSec / Math.max(points.length, 1);
  return playSequence(pointSteps(points, stepSec, stepSec * 0.8), {
    name: "opening",
    liftTrackGate: true,
    onStart(time, graph, totalSec) {
      const g = graph.fade.gain;
      g.cancelScheduledValues(time);
      g.setValueAtTime(0, time);
      g.linearRampToValueAtTime(1, time + OPENING_FADE_IN_SEC);
      g.setValueAtTime(1, time + totalSec - OPENING_FADE_OUT_SEC);
      g.linearRampToValueAtTime(0, time + totalSec);
      g.setValueAtTime(1, time + totalSec + TAIL_SEC + SCHEDULE_AHEAD_SEC + 0.1);
      emitCaption("caption.opening.closeEyes");
    },
    onEnd: () => emitCaption("caption.opening.openEyes"),
  });
}
