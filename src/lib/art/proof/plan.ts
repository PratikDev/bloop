import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { seeded } from "@/lib/audio/orchestra";

interface DataStep {
  value: number | null;
  out: number | null;
}

export interface ProofPlan {
  recordId: string;
  voiceId: string;
  kind: "pitch" | "drops";
  stepSec: number;
  steps: DataStep[];
  drops: number[];
}

export function pitchPlan(recordId: string, voiceId: string, values: readonly (number | null)[], stepSec: number): ProofPlan {
  const rule = continuousRule(voiceId);
  if (rule.output.param !== "frequency") throw new Error(`${voiceId}: not a pitch rule`);
  return { recordId, voiceId, kind: "pitch", stepSec, steps: values.map((value) => ({ value, out: mapContinuous(value, rule) })), drops: [] };
}

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

export const planSeconds = (p: ProofPlan) => p.steps.length * p.stepSec + 0.5;
