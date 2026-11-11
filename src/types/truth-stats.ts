// public/data/truth/stats.json (pipeline/stats/truth_stats.py): Spearman's rho and n for each How we
// know check, from the shipped pair files (VALIDATION_TABLE.md has the errors, not the correlation).

export interface RankCorrelation {
  source: string; // the pair file it was computed from
  spearman_rho: number;
  p: number;
  n: number;
}

export interface TruthStatsFile {
  title: string;
  disclosure: string;
  sst: RankCorrelation & { frame_time_utc: string };
  rain: RankCorrelation & { frame_time_utc: string; pairs_used: string };
  globe: RankCorrelation;
  generated_utc: string;
}
