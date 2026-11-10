// Summarises the listener test's exported files (mentor item 8; docs/LISTEN_TEST_PROTOCOL.md): n, correct answers and
// accuracy per task. Formative only: 5-10 listeners say whether the sounds are understood, not how well in general.
// Usage: bun scripts/listen-test-summary.ts <folder>   (or: bun run listen-test:summary <folder>)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isResultsFile, summarise, type ResultsFile } from "../src/lib/listen-test/results";
import { TASK_IDS } from "../src/lib/listen-test/tasks";
import { extrasReport } from "../src/lib/listen-test/extras/summary"; // ART

export function readFolder(folder: string): { files: ResultsFile[]; skipped: string[] } {
  const files: ResultsFile[] = [];
  const skipped: string[] = [];
  for (const name of readdirSync(folder).filter((n) => n.endsWith(".json")).sort()) {
    const parsed = JSON.parse(readFileSync(join(folder, name), "utf8"));
    if (isResultsFile(parsed)) files.push(parsed);
    else skipped.push(name);
  }
  return { files, skipped };
}

export function report(folder: string): string {
  const { files, skipped } = readFolder(folder);
  const s = summarise(files, TASK_IDS);
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const lines = [
    "Bloop listener test: formative only (a small, informal check; not a validation)",
    `Listeners (files): ${s.listeners}`,
    "",
    "Task     n  correct  accuracy",
    ...s.tasks.map((t) => `${t.task.padEnd(7)} ${String(t.n).padStart(2)}  ${String(t.correct).padStart(7)}  ${t.n ? pct(t.accuracy).padStart(8) : "     n/a"}`),
  ];
  lines.push(...extrasReport(files)); // ART: emotion ratings and ear vs eye (testVersion 2+)
  if (skipped.length) lines.push("", `Not listener-test files (skipped): ${skipped.join(", ")}`);
  return lines.join("\n");
}

if (import.meta.main) {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: bun scripts/listen-test-summary.ts <folder of exported .json files>");
    process.exit(2);
  }
  console.log(report(folder));
}
