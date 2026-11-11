import type { OptionId, TaskId } from "./tasks";
import type { ExtraRecord } from "./extras/types";
import { CV_TASK_IDS } from "./chord";

const RESULTS_KIND = "bloop-listen-test";
const RESULTS_VERSION = 1;
const TEST_VERSION = 3;

export interface TaskResult {
  task: TaskId;
  answer: OptionId;
  correct_answer: OptionId;
  correct: boolean;
  ms: number;
}

export interface ResultsFile {
  kind: typeof RESULTS_KIND;
  version: typeof RESULTS_VERSION;
  formative: true;
  lang: "en" | "bn";
  results: TaskResult[];
  comment: string;
  testVersion?: number;
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

export const exportName = (d: Date) => `listen-test-${d.toISOString().slice(0, 16).replace(/[-:]/gu, "").replace("T", "-")}.json`;

interface TaskSummary {
  task: TaskId;
  n: number;
  correct: number;
  accuracy: number;
}

export function isResultsFile(v: { kind?: unknown; results?: unknown } | null): v is ResultsFile {
  return !!v && v.kind === RESULTS_KIND && Array.isArray(v.results);
}

export function summarise(files: readonly ResultsFile[], order: readonly TaskId[]): { listeners: number; tasks: TaskSummary[] } {
  const tasks = order.map((task) => {
    const answers = files.flatMap((f) => f.results.filter((r) => r.task === task));
    const correct = answers.filter((r) => r.correct).length;
    return { task, n: answers.length, correct, accuracy: answers.length ? correct / answers.length : 0 };
  });
  return { listeners: files.length, tasks };
}
