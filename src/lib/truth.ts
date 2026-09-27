// Truth panel numbers, taken from rain.json (docs/L3/contract-proposals.md §A2).
// The sentence names the IMERG run that was actually checked.

import type { RainMetadata } from "@/types/data-contract";

export interface RainTruth {
  run: string; // "Early" | "Late"
  percent: number; // typical error, %
  points: number;
  oneFrame: boolean;
  allAgreed: boolean;
  agreedPct: number;
  checkedUtc: string | null;
}

/** A median |log10 error| as a typical percentage: (10^m − 1) × 100 (how verified.approx_percent is derived). */
const logErrorToPercent = (m: number) => (Math.pow(10, m) - 1) * 100;

/** Prefers today's re-check (latest_check); falls back to the original verification. */
export function rainTruth(meta: RainMetadata): RainTruth {
  const check = meta.latest_check;
  if (check) {
    return {
      run: check.imerg_run,
      percent: logErrorToPercent(check.median_abs_log10),
      points: check.n_both_rain,
      oneFrame: true,
      allAgreed: check.agreement === 1,
      agreedPct: check.agreement * 100,
      checkedUtc: check.checked_utc,
    };
  }
  const v = meta.verified;
  return {
    run: v.matched_run.replace(/^IMERG\s*/, ""),
    percent: v.approx_percent,
    points: v.n_points,
    oneFrame: v.frames_tested === 1,
    allAgreed: v.agreement === 1,
    agreedPct: v.agreement * 100,
    checkedUtc: null,
  };
}

/** What the published rain plot shows: the original verification. */
export function rainPlotSource(meta: RainMetadata): { run: string; points: number } {
  return { run: meta.verified.matched_run.replace(/^IMERG\s*/, ""), points: meta.verified.n_points };
}
