// Truth panel numbers, read from sst.json and rain.json in the shape of L1's
// wording templates (docs/L1/DATA_HANDOFF.md §4). They change with each data
// refresh, which is why they are read, never typed.

import type { RainMetadata, SstMetadata } from "@/types/data-contract";

export interface OceanTruth {
  lo: number; // °C at the colorbar's first tick, as calibrated
  hi: number;
  legend: string; // what the colorbar's own labels say, e.g. "−5…35"
  median: number; // median error, °C
  points: number;
  /** A passing re-check on a later frame, if the pipeline ran one. */
  recheck: { date: string; median: number } | null;
}

export interface RainTruth {
  run: string; // "Late" | "Early": the IMERG run of the original check
  percent: number; // typical error, %
  points: number;
  oneFrame: boolean;
  allAgreed: boolean;
  agreedPct: number;
  /** The run the newest frame was re-checked against, if that check passed. */
  recheckRun: string | null;
  checkedUtc: string | null;
}

const MINUS = "−";

/** "-5..35 C" → "−5…35" (DATA_HANDOFF §4). */
const legendText = (labels: string) => labels.replace(" C", "").replace("..", "…").replace(/-/g, MINUS);

/** Null if the frame carries no calibration: the panel then says the check is being updated. */
export function oceanTruth(meta: SstMetadata): OceanTruth | null {
  const cal = meta.calibration;
  if (!cal) return null;
  const check = meta.latest_check;
  return {
    lo: cal.value_at_ticks_C[0],
    hi: cal.value_at_ticks_C[1],
    legend: legendText(cal.legend_labels),
    median: meta.verified.value,
    points: meta.verified.n_points,
    recheck: check?.pass ? { date: check.date, median: check.median_abs } : null,
  };
}

/** The original check (verified), plus the newest frame's re-check when it passed. */
export function rainTruth(meta: RainMetadata): RainTruth {
  const v = meta.verified;
  const check = meta.latest_check;
  return {
    run: v.matched_run.replace(/^IMERG\s*/, ""),
    percent: v.approx_percent,
    points: v.n_points,
    oneFrame: (v.frames_tested ?? 1) === 1,
    allAgreed: v.agreement === 1,
    agreedPct: v.agreement * 100,
    recheckRun: check?.pass ? check.imerg_run : null,
    checkedUtc: check?.checked_utc ?? null,
  };
}
