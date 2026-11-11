// The data-voice check (the pitch-identity test): render one plan under several setups (art off,
// each dial stop, each family) and assert the data voice is the same: the logged pitch per note identical, the
// measured settled pitch within 1 cent of the art-off render and of the rule, the onset count and tempo identical.
// The dial's "Check the data voice" button and the CI test (qa/e2e/art) both run this.

import { DIAL_STOPS, EARTH_CATEGORIES, type DialStop } from "@/lib/audio/layers/types";
import type { Timbre } from "@/lib/audio/orchestra";
import { maxCents, measurePitch, onsetTimes } from "./measure";
import type { ProofPlan } from "./plan";
import { renderProof, type Setup } from "./render";

export const CENT_LIMIT = 1;

export interface SetupResult {
  setup: Setup;
  loggedHz: number[];
  measuredHz: number[];
  onsets: number[];
  /** Largest |measured − rule| (cents) over the notes. */
  centsVsRule: number;
  /** Largest |measured − art-off measured| (cents). */
  centsVsOff: number;
}

export interface CheckResult {
  recordId: string;
  kind: ProofPlan["kind"];
  results: SetupResult[];
  onsetsEqual: boolean;
  tempoEqual: boolean;
  maxCents: number;
  pass: boolean;
}

const tempo = (onsets: readonly number[]) => (onsets.length < 2 ? 0 : (onsets[onsets.length - 1] - onsets[0]) / (onsets.length - 1));
const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-9);

/** The setups for the dial: art off (today's app), then 0, 0.5 and 1, in one family, and 1 again in a monsoon month
 *  (the drone's season colour). */
export const dialSetups = (timbre: Timbre): Setup[] => [
  { stop: null, timbre: "plain", path: "voice" },
  ...DIAL_STOPS.map((stop: DialStop): Setup => ({ stop, timbre, path: "voice" })),
  { stop: 1, timbre, path: "voice", month: 7 },
];

/** The setups for Earth Orchestra: art off, then every family as the live voice and as OrchestraApi notes. */
export const categorySetups = (): Setup[] => [
  { stop: null, timbre: "plain", path: "voice" },
  ...EARTH_CATEGORIES.flatMap((c): Setup[] => [
    { stop: 0.5, timbre: c, path: "voice" },
    { stop: 0.5, timbre: c, path: "notes" },
  ]),
];

export async function checkPlan(plan: ProofPlan, setups: readonly Setup[]): Promise<CheckResult> {
  const results: SetupResult[] = [];
  for (const setup of setups) {
    const r = await renderProof(plan, setup);
    const measuredHz = r.notes.map((n) => measurePitch(r.data[n.channel], r.sampleRate, n.settleFrom, n.to, n.hz));
    const onsets = plan.kind === "drops" ? onsetTimes(r.data[0], r.sampleRate) : r.notes.map((n) => n.onset);
    const loggedHz = r.notes.map((n) => n.hz);
    const base = results[0];
    results.push({
      setup,
      loggedHz,
      measuredHz,
      onsets,
      centsVsRule: maxCents(measuredHz, loggedHz),
      centsVsOff: base ? maxCents(measuredHz, base.measuredHz) : 0,
    });
  }
  const base = results[0];
  const onsetsEqual = results.every((r) => (plan.kind === "drops" ? r.onsets.length === base.onsets.length : same(r.onsets, base.onsets)));
  const tempoEqual = results.every((r) => Math.abs(tempo(r.onsets) - tempo(base.onsets)) < (plan.kind === "drops" ? 0.005 : 1e-9));
  const loggedEqual = results.every((r) => same(r.loggedHz, base.loggedHz));
  const maxC = Math.max(...results.map((r) => Math.max(r.centsVsOff, r.centsVsRule)));
  return { recordId: plan.recordId, kind: plan.kind, results, onsetsEqual, tempoEqual, maxCents: maxC, pass: loggedEqual && onsetsEqual && tempoEqual && maxC <= CENT_LIMIT };
}
