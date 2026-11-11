// PURE: what the data-voice check renders (the pitch-identity proof). A plan is a record's own
// values at its own tempo, turned into the data voice's notes by the record's rule (mapping.json, the same function
// the engines use). The plan is fixed before rendering; the renderer logs what it actually scheduled at each dial
// stop, and the check compares those logs and the measured audio.

import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { seeded } from "@/lib/audio/orchestra";

export interface DataStep {
  value: number | null;
  /** The rule's output: Hz for a pitch rule, events per second for a rate rule; null = silence. */
  out: number | null;
}

export interface ProofPlan {
  /** The record the plan is from (a Listen voice id or an Official record id). */
  recordId: string;
  /** The sound rule that turns values into sound (mapping.json id). */
  voiceId: string;
  kind: "pitch" | "drops";
  stepSec: number;
  steps: DataStep[];
  /** Drops only: every drop's onset (s from the start), fixed by a seeded clock. */
  drops: number[];
}

/** A pitch record: one note per value at `stepSec`, through the rule. */
export function pitchPlan(recordId: string, voiceId: string, values: readonly (number | null)[], stepSec: number): ProofPlan {
  const rule = continuousRule(voiceId);
  if (rule.output.param !== "frequency") throw new Error(`${voiceId}: not a pitch rule`);
  return { recordId, voiceId, kind: "pitch", stepSec, steps: values.map((value) => ({ value, out: mapContinuous(value, rule) })), drops: [] };
}

/** A rate record (rain, monsoon): each step's drops through the rule (per second, or per step for a dropsPerStep rule),
 *  placed by a seeded clock (as the live drop clock: even spacing with a little jitter). Dry or no data = no drops. */
export function dropPlan(recordId: string, voiceId: string, values: readonly (number | null)[], stepSec: number, seed = 4285): ProofPlan {
  const rule = continuousRule(voiceId);
  const perStep = rule.output.param === "dropsPerStep";
  const random = seeded(seed);
  const steps = values.map((value) => ({ value, out: value !== null && value > 0 ? mapContinuous(value, rule) : null }));
  const drops: number[] = [];
  steps.forEach((s, i) => {
    if (s.out === null) return;
    const n = Math.max(1, Math.round(perStep ? s.out : s.out * stepSec));
    for (let k = 0; k < n; k++) drops.push(Number((i * stepSec + ((k + 0.25 + 0.5 * random()) * stepSec) / n).toFixed(6)));
  });
  return { recordId, voiceId, kind: "drops", stepSec, steps, drops };
}

/** The plan's length (s), with a short tail. */
export const planSeconds = (p: ProofPlan) => p.steps.length * p.stepSec + 0.5;
