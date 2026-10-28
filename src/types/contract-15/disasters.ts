// §15 disasters: SVS 5584 landslide exposure classes.

import type { GridBlock, ProductHeader } from "./common";
import type { ClassCode } from "./fire";

// latest/landslide_class.bin — Uint8: 0 = none shown; 1..N = the legend's classes, lowest first.
export interface LandslideClassMetadata extends ProductHeader {
  svs_id: 5584;
  svs_page: string;
  frame_time_utc: string;
  frame_time_source: string;
  source_file: string;
  projection_of_source: "Robinson";
  classes: ClassCode[];
  legend_swatches_rgb: number[][];
  grid: GridBlock<"uint8_class"> & { nodata: number };
  cells_per_class: number[];
  verified: { test: "C5584"; status: string; age_days: number | null };
}
