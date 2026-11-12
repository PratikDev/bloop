// PURE: the summary of ART's extra tasks across exported files (scripts/listen-test-summary.ts prints it). Emotion:
// mean valence and connection per condition (sound / visual), with n. Ear vs eye: correct answers per sense, with n.
// Formative only; never shown in the app.

import type { ResultsFile } from "../results";

export interface ConditionMeans {
  condition: string;
  n: number;
  valence: number;
  connection: number;
}

export interface SenseAccuracy {
  sense: string;
  n: number;
  correct: number;
}

const num = (v: unknown) => (typeof v === "number" ? v : NaN);

export function emotionSummary(files: readonly ResultsFile[]): ConditionMeans[] {
  const rows = files.flatMap((f) => f.extras?.emotion ?? []);
  return ["sound", "visual"].map((condition) => {
    const r = rows.filter((x) => x.condition === condition);
    const mean = (k: string) => (r.length ? r.reduce((s, x) => s + num(x[k]), 0) / r.length : NaN);
    return { condition, n: r.length, valence: mean("valence"), connection: mean("connection") };
  });
}

export function earEyeSummary(files: readonly ResultsFile[]): SenseAccuracy[] {
  const rows = files.flatMap((f) => f.extras?.earEye ?? []);
  return ["sound", "picture"].map((sense) => {
    const r = rows.filter((x) => x.sense === sense);
    return { sense, n: r.length, correct: r.filter((x) => x.correct === true).length };
  });
}

/** Lines for the printed summary (empty when no file has the extras: sessions before testVersion 2). */
export function extrasReport(files: readonly ResultsFile[]): string[] {
  const v2 = files.filter((f) => (f.testVersion ?? 1) >= 2);
  if (!v2.length) return [];
  const f2 = (x: number) => (Number.isNaN(x) ? "n/a" : x.toFixed(2));
  return [
    "",
    `Sessions with the emotion and ear-vs-eye tasks (testVersion 2+): ${v2.length}`,
    "Emotion  n  valence  connection (1-5, means)",
    ...emotionSummary(v2).map((c) => `${c.condition.padEnd(7)} ${String(c.n).padStart(2)}  ${f2(c.valence).padStart(7)}  ${f2(c.connection).padStart(10)}`),
    "Ear vs eye  n  correct",
    ...earEyeSummary(v2).map((s) => `${s.sense.padEnd(10)} ${String(s.n).padStart(2)}  ${String(s.correct).padStart(7)}`),
  ];
}
