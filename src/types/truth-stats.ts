interface RankCorrelation {
  source: string;
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
