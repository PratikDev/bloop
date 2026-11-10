// PURE: "Water's journey", a Bangladesh suite (docs/statement/ART.md, Tier 2), from records already shipped: lightning
// (SVS 5011, pattern only) → an atmospheric river (SVS 4960, relative) → IMERG rain over Bangladesh (the storm the
// time-lapse follows) → GRACE water stored under Bangladesh → the Bay of Bengal's sea surface (MUR). Each step plays
// its record's own rule at its own pace in its Earth Orchestra family, with the dial at 1 (swara + meend, drone, reverb:
// the data voice unchanged), 2 s of silence between datasets. Every value comes from the data files.

import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { getCategory } from "@/lib/audio/orchestra";
import type { EarthCategory } from "@/lib/audio/layers/types";
import { dropPlan } from "../proof/plan";

export const JOURNEY_STEPS = ["lightning", "river", "rain", "water", "sea"] as const;
export type JourneyStepId = (typeof JOURNEY_STEPS)[number];
export const GAP_SEC = 2;

export type JourneyEvent = { kind: "tone"; hz: number; at: number; dur: number } | { kind: "tick"; at: number; noise: "drop" | "click" };

export interface JourneySource {
  id: JourneyStepId;
  recordId: string;
  voiceId: string;
  values: (number | null)[];
  stepSec: number;
  dataset: string;
  period: string;
  status: string;
}

export interface JourneyStep extends Omit<JourneySource, "values"> {
  values: (number | null)[];
  category: EarthCategory | null;
  /** The step's Sa: the bottom of its pitch rule (a fixed note; never moved by data); null for a rate rule. */
  sa: number | null;
  start: number;
  end: number;
  events: JourneyEvent[];
}

export interface Journey {
  steps: JourneyStep[];
  seconds: number;
}

function events(s: JourneySource, start: number): JourneyEvent[] {
  const rule = continuousRule(s.voiceId);
  if (rule.output.param === "frequency") {
    return s.values.flatMap((v, i) => {
      const hz = mapContinuous(v, rule);
      return hz === null ? [] : [{ kind: "tone" as const, hz, at: start + i * s.stepSec, dur: s.stepSec * 0.92 }];
    });
  }
  if (rule.output.param === "dropsPerSecond") {
    return dropPlan(s.recordId, s.voiceId, s.values, s.stepSec).drops.map((t) => ({ kind: "tick" as const, at: start + t, noise: "drop" as const }));
  }
  // A rate rule (clicks per second): that many evenly spaced clicks in each step.
  return s.values.flatMap((v, i) => {
    const rate = v === null ? null : mapContinuous(v, rule);
    const n = rate === null ? 0 : Math.max(1, Math.round(rate * s.stepSec));
    return Array.from({ length: n }, (_, k) => ({ kind: "tick" as const, at: start + i * s.stepSec + (k * s.stepSec) / n, noise: "click" as const }));
  });
}

export function buildJourney(sources: readonly JourneySource[]): Journey {
  let t = 0;
  const steps = sources.map((s, i): JourneyStep => {
    const start = t + (i ? GAP_SEC : 0);
    const end = start + s.values.length * s.stepSec;
    t = end;
    const rule = continuousRule(s.voiceId);
    return { ...s, category: getCategory(s.recordId), sa: rule.output.param === "frequency" ? rule.output.min : null, start, end, events: events(s, start) };
  });
  return { steps, seconds: t + 1 };
}

/** The step sounding at time t (s from the start), or null in a gap. */
export const stepAt = (j: Journey, t: number) => j.steps.find((s) => t >= s.start && t < s.end) ?? null;
