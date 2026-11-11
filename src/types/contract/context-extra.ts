// ---------------------------------------------------------------------------
// 11. Bangladesh ensemble (context/ensemble_bd.json) — OPTIONAL, additive
// Needed by: BOTH — L3 draws three lines on the History chart (toggle per
// voice, playhead, show `disclosure`); L2 plays the three voices together.
// Built only from files 4 and 5 above (build_ensemble.py); no new data.
// voices.X.values[i] belongs to months[i]; null = no measurement → silence
// (water is null before 2002-04 and during the Jul 2017–May 2018 GRACE gap).
// ---------------------------------------------------------------------------

interface EnsembleVoice {
  values: (number | null)[];
  units: string;
  dataset: string;
  place: string;
  resolution: string;
  mapping_key: string; // "Heat then vs now" | "Monsoon then vs now" | "Water" (TEAM_BUILD_PLAN Section 10)
  credit: string;
  caveat?: string | null; // rain only
  gap_note?: string; // water only
  starts?: string; // water only
}

export interface EnsembleFile {
  title: string;
  months: string[]; // "YYYY-MM", consecutive from 1981-01
  voices: { heat: EnsembleVoice; rain: EnsembleVoice; water: EnsembleVoice };
  disclosure: string;
  generated_utc: string;
}

// ---------------------------------------------------------------------------
// 12. GLOBE duet teaser (context/globe_duet.json) — OPTIONAL, additive
// Needed by: L3 (teaser card: time, place, both values, `disclosure`,
// Built from file 8 (build_globe_duet.py): only observations inside
// Bangladesh's national outline; reports on the same date within 1 km are
// merged. `featured` = the place-day with the median difference (typical case).
// status "insufficient" = fewer than 20 place-days → don't show the teaser.
// ---------------------------------------------------------------------------

interface GlobeDuetPair {
  date: string; // "YYYY-MM-DD"
  lat: number;
  lon: number;
  ground_pct: number; // observer's cloud cover, % (category midpoint, approximate)
  satellite_pct: number; // geostationary satellite cloud cover, %
  n_reports: number; // reports merged into this place-day
  satellite: string | null;
  difference_pct: number; // satellite_pct − ground_pct
}

export interface GlobeDuetFile {
  title: string;
  status: "ok" | "insufficient";
  region: "Bangladesh" | "Bangladesh and surrounding area";
  region_note: string;
  ground_value: {
    primary: string;
    fallback: string;
    counts: { category: number; range_fallback: number };
    category_midpoints: Record<string, number>;
    note: string;
  };
  satellite_value: string;
  dropped: {
    outside_bangladesh: number;
    obscured: number;
    unknown_category: number;
    missing_ground: number;
    missing_satellite: number;
  };
  summary: {
    raw_pairs: number;
    unique_place_days: number;
    merge_radius_km: number; // 1
    busiest_day?: Record<string, number>; // absent when there are no pairs
    median_abs_difference_pct?: number;
    share_within_25_points?: number;
  };
  featured: GlobeDuetPair | null;
  pairs: GlobeDuetPair[];
  disclosure: string;
  credit: string;
  generated_utc: string;
}
