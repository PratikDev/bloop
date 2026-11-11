// public/data/thenvsnow/stats.json (pipeline/stats/then_vs_now_stats.py): the uncertainty and
// significance of every Then vs Now claim. Method and every number: docs/THEN_VS_NOW_STATS.md.

import type { ClimateCellName, GraceBoxName } from "./data-contract";

export interface StatWindow {
  window: [number, number];
  n: number;
  mean: number;
}

/** Window B against window A (B − A), from the yearly values the app plays. */
export interface StatComparison {
  shown: "diff" | "change_pct"; // which number the app shows (°C / cm difference, or % change)
  unit: string;
  A: StatWindow;
  B: StatWindow;
  diff: number;
  diff_ci: [number, number]; // 95% bootstrap interval
  change_pct: number;
  change_pct_ci: [number, number];
  p_welch: number;
  p_mann_whitney: number;
  t: number;
  u: number;
  clear: boolean; // both p < 0.05 and the shown CI excludes 0
}

export interface StatTrend {
  years: [number, number];
  n: number;
  test: string; // "Mann-Kendall" or "Mann-Kendall, Hamed-Rao modified"
  s: number;
  z: number;
  p: number;
  tau: number;
  sen_slope: number; // per year
  sen_slope_ci: [number, number];
  unit: string;
  lag1_autocorr: number;
  variance_factor: number;
  clear: boolean;
}

export interface RainSourceStats extends StatComparison {
  source: "GPCP" | "GPCC";
  jjas_total_mm: StatComparison;
  annual_total_mm: StatComparison;
}

export interface CityStats {
  heat: StatComparison & { source: string; season: string; trend: StatTrend };
  rain: {
    season: string;
    shown_as: string;
    gpcp: RainSourceStats;
    gpcc: RainSourceStats;
    gpcp_newer: StatComparison & { source: "GPCP" };
  };
}

export interface WaterStats {
  windows: StatComparison & { basis: string };
  trend: StatTrend & { basis: string };
  uncertainty_1sigma_cm: { median: number; min: number; max: number } | null;
  uncertainty_note: string | null;
}

export interface ThenNowStatsFile {
  title: string;
  method: {
    alpha: number;
    ci: string;
    bootstrap_draws: number;
    seed: number;
    tests: string;
    trend: string;
    clear_rule: string;
    script: string;
    doc: string;
  };
  cities: Record<ClimateCellName, CityStats>;
  water: Record<GraceBoxName, WaterStats>;
  generated_utc: string;
}
