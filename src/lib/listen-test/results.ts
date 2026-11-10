// The listener test's results (mentor item 8): kept in memory only; "Export results" saves them as a JSON file. No
// names, no IP, no audio. scripts/listen-test-summary.ts reads the exported files.

import type { OptionId, TaskId } from "./tasks";
import type { ExtraRecord } from "./extras/types"; // ART
import { CV_TASK_IDS } from "./chord";

export const RESULTS_KIND = "bloop-listen-test";
export const RESULTS_VERSION = 1;
// Which set of tasks a session ran, so earlier sessions stay separable: 1 = the five core tasks only (every session
// before 10 Nov 2026); 2 = + the emotion ratings and ear-vs-eye (ART's build, never deployed); 3 = the integrated test
// (10 Nov 2026): any of CV's two chord tasks or ART's extras ran.
export const TEST_VERSION = 3;

export interface TaskResult {
  task: TaskId;
  answer: OptionId;
  correct_answer: OptionId;
  correct: boolean;
  /** From the task showing to the answer. */
  ms: number;
}

export interface ResultsFile {
  kind: typeof RESULTS_KIND;
  version: typeof RESULTS_VERSION;
  formative: true;
  lang: "en" | "bn";
  results: TaskResult[];
  comment: string;
  /** ART: the task set's version (missing in files from before it existed: read as 1). */
  testVersion?: number;
  /** ART: each extra task module's answers, by its id (registry.ts). */
  extras?: Record<string, ExtraRecord[]>;
}

export const resultsFile = (lang: "en" | "bn", results: TaskResult[], comment: string, extras: Record<string, ExtraRecord[]> = {}): ResultsFile => ({
  kind: RESULTS_KIND,
  version: RESULTS_VERSION,
  testVersion: Object.keys(extras).length || results.some((r) => (CV_TASK_IDS as readonly string[]).includes(r.task)) ? TEST_VERSION : 1,
  formative: true,
  lang,
  results,
  comment: comment.trim(),
  extras,
});

/** The download's name: the date and time only (the protocol renames it to the session number). */
export const exportName = (d: Date) => `listen-test-${d.toISOString().slice(0, 16).replace(/[-:]/gu, "").replace("T", "-")}.json`;

export interface TaskSummary {
  task: TaskId;
  n: number;
  correct: number;
  accuracy: number;
}

/** A parsed JSON value that is one of our exported files. */
export function isResultsFile(v: { kind?: unknown; results?: unknown } | null): v is ResultsFile {
  return !!v && v.kind === RESULTS_KIND && Array.isArray(v.results);
}

/** Per task: how many listeners answered it, how many were right, and the share right. */
export function summarise(files: readonly ResultsFile[], order: readonly TaskId[]): { listeners: number; tasks: TaskSummary[] } {
  const tasks = order.map((task) => {
    const answers = files.flatMap((f) => f.results.filter((r) => r.task === task));
    const correct = answers.filter((r) => r.correct).length;
    return { task, n: answers.length, correct, accuracy: answers.length ? correct / answers.length : 0 };
  });
  return { listeners: files.length, tasks };
}
