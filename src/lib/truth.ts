// Truth panel numbers, taken from rain.json (docs/L3/contract-proposals.md §A2) and
// sst.json's latest_check (written by verify_latest.py on a frame other than the calibration one).
// The sentence names the IMERG run that was actually checked.

import type { RainMetadata, SstMetadata } from "@/types/data-contract";

export interface OceanTruth {
  median: number; // °C
  n: number;
  date: string; // the MUR day the frame was checked against
  checkedUtc: string;
  pass: boolean;
}

/** The ocean check on today's frame; null until verify_latest.py has run for it. */
export function oceanTruth(meta: SstMetadata): OceanTruth | null {
  const c = meta.latest_check;
  return c ? { median: c.median_abs, n: c.n, date: c.date, checkedUtc: c.checked_utc, pass: c.pass } : null;
}

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
