// §15 truth files: the points behind latest_check (pipeline/verify_latest.py) and the
// three-way reading (pipeline/products/ocean/threeway.py).

import type { RainLatestCheck, SstLatestCheck } from "../data-contract";
import type { ProductHeader } from "./common";

// truth/sst_pairs.json — the 60 ocean points; their median |frame − file| = latest_check.median_abs.
export interface SstTruthPair {
  lat: number;
  lon: number;
  frame: number; // °C read from the EIC frame (SVS 5101)
  file: number; // °C in NASA's MUR file, same place
}

export interface SstPairsFile extends ProductHeader {
  units: "degC";
  frame_time_utc: string;
  check: SstLatestCheck;
  pairs: SstTruthPair[];
}

// truth/rain_pairs.json — 150 rain + 150 dry points; frame = 0 on dry points.
export interface RainTruthPair {
  lat: number;
  lon: number;
  kind: "rain" | "dry";
  frame: number; // mm/h from the EIC frame (SVS 4285)
  file: number; // mm/h in NASA's IMERG file, same half-hour
}

export interface RainPairsFile extends ProductHeader {
  units: "mm/h";
  frame_time_utc: string;
  check: RainLatestCheck;
  pairs: RainTruthPair[];
}

// truth/threeway.json — frame vs GIBS colormap value vs MUR file, at the sst_pairs points.
export interface ThreeWayPoint {
  lat: number;
  lon: number;
  frame: number;
  file: number;
  gibs: number | null; // midpoint of the GIBS colour's bin; null = beyond its range or no data
  gibs_bin: [number | null, number | null] | null;
  gibs_beyond: "below" | "above" | null;
}

export interface ThreeWayFile extends ProductHeader {
  units: string;
  mur_date: string;
  gibs_layer: string;
  gibs_colormap: string;
  gibs_bin_widths: number[];
  gibs_range: [number, number];
  gibs_decode_share: number;
  summary: {
    n: number;
    n_gibs: number;
    n_beyond_gibs_range: number;
    median_abs_frame_vs_file: number | null;
    median_abs_gibs_vs_file: number | null;
    median_abs_frame_vs_gibs: number | null;
  };
  points: ThreeWayPoint[];
}
