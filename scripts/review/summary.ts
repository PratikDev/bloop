// Prints the failures in docs/review/metrics.json, one line each (nothing for what passes).
import { readFileSync } from "node:fs";
import type { Result, Report } from "./capture-types.ts";

const MAX_CONTROLS = 8; // docs/FINAL_PASS.md: at most 8 per page and player on desktop
const EMPTY_PCT = 20;

/** The failures of one capture, each as a short sentence. */
export function failures(r: Result, desktop: boolean): string[] {
  const f: string[] = [];
  if (desktop && r.pageScroll > 0) f.push(`page scrolls ${r.pageScroll}px`);
  if (r.sidewaysDoc > 0 || r.sidewaysMain > 0) f.push(`scrolls sideways (doc ${r.sidewaysDoc}, main ${r.sidewaysMain})`);
  if (r.overlaps.length) f.push(`${r.overlaps.length} text overlap(s): ${r.overlaps.slice(0, 2).join("; ")}`);
  if (r.smallText.length) f.push(`${r.smallText.length} text under 14px: ${r.smallText.slice(0, 3).join("; ")}`);
  if (r.lowContrast.length) f.push(`${r.lowContrast.length} contrast pair(s) under 4.5:1: ${r.lowContrast.slice(0, 3).join("; ")}`);
  if (desktop && r.controlsOutsideMap > MAX_CONTROLS) f.push(`${r.controlsOutsideMap} controls outside the map (max ${MAX_CONTROLS})`);
  if (r.coralControls.length > 1) f.push(`${r.coralControls.length} coral controls: ${r.coralControls.join(", ")}`);
  if (r.hardShadowStatic.length) f.push(`${r.hardShadowStatic.length} non-interactive hard shadow(s): ${r.hardShadowStatic.slice(0, 3).join("; ")}`);
  if (r.axe.length) f.push(`axe: ${r.axe.join("; ")}`);
  if (r.consoleErrors.length) f.push(`${r.consoleErrors.length} console error(s): ${r.consoleErrors[0].slice(0, 100)}`);
  if (r.emptyAreaPct > EMPTY_PCT) f.push(`empty area ${r.emptyAreaPct}% (${r.emptyAreaPx2} px²)`);
  if (r.englishInBangla.length) f.push(`${r.englishInBangla.length} English in Bangla: ${r.englishInBangla.slice(0, 6).join("; ")}`);
  return f;
}

const report = JSON.parse(readFileSync(new URL("../../docs/review/metrics.json", import.meta.url), "utf8")) as Report;
for (const [path, sizes] of Object.entries(report.pages)) {
  for (const [size, r] of Object.entries(sizes)) for (const line of failures(r, !size.startsWith("390"))) console.log(`${path} @ ${size}: ${line}`);
}
for (const [name, r] of Object.entries(report.states)) for (const line of failures(r, true)) console.log(`[${name}]: ${line}`);
