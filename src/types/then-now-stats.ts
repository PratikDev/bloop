import type { ClimateCellName, GraceBoxName } from "./data-contract";

interface StatWindow {
  window: [number, number];
  n: number;
  mean: number;
}

export interface StatComparison {
  shown: "diff" | "change_pct";
  unit: string;
  A: StatWindow;
  B: StatWindow;
  diff: number;
  diff_ci: [number, number];
  change_pct: number;
  change_pct_ci: [number, number];
  p_welch: number;
  p_mann_whitney: number;
  t: number;
  u: number;
  clear: boolean;
}

export interface StatTrend {
  years: [number, number];
  n: number;
  test: string;
  s: number;
  z: number;
  p: number;
  tau: number;
  sen_slope: number;
  sen_slope_ci: [number, number];
  unit: string;
  lag1_autocorr: number;
  variance_factor: number;
  clear: boolean;
}

interface RainSourceStats extends StatComparison {
  source: "GPCP" | "GPCC";
  jjas_total_mm: StatComparison;
  annual_total_mm: StatComparison;
}

interface CityStats {
  heat: StatComparison & { source: string; season: string; trend: StatTrend };
  rain: {
    season: string;
    shown_as: string;
    gpcp: RainSourceStats;
    gpcc: RainSourceStats;
    gpcp_newer: StatComparison & { source: "GPCP" };
  };
}

interface WaterStats {
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
