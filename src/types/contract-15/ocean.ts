// §15 ocean grids (1024×512, the sst.bin layout).

import type { GridBlock, ProductHeader } from "./common";

// latest/sst_anom.bin — Int16 LE; °C = code / grid.scale; grid.nodata (−32768) = land / ice / no data.
// Decoded from SVS 5176 with the colorbar's 9 ticks; saturates at value_range ends.
export interface SstAnomalyMetadata extends ProductHeader {
  svs_id: 5176;
  svs_page: string;
  frame_time_utc: string | null;
  frame_time_source: string;
  source_file: string;
  colorbar_file: string;
  units: "degC";
  value_range: [number, number];
  saturates_at_range_ends: boolean;
  calibration: {
    ticks_px: number[];
    px_per_C: number;
    value_at_ticks_C: number[];
    strip_span_px: [number, number];
    max_colour_distance: number;
    decoded_pixel_share: number;
    saturated_share: number;
  };
  grid: GridBlock<"int16_scaled"> & { scale: number; nodata: number };
  verified: {
    test: "C5176";
    status: string;
    against: string | null; // the NOAA CRW ERDDAP dataset
    against_time: string | null;
    n_points: number | null;
    n_abs_ge_0_5: number | null;
    sign_agreement: number | null; // 0..1, where |anomaly| ≥ 0.5 °C
    spearman: number | null;
    median_offset_C: number | null; // frame − CRW (different baselines)
    median_abs_offset_C: number | null;
    ticks_found: number | null;
  };
}

// latest/sst_dt.bin — Uint8 hours since a 1 km infrared datum (MUR dt_1km_data), cell mean;
// grid.no_look (254) = most of the cell had none in MUR's window; grid.nodata (255) = land.
export interface SstDtMetadata extends ProductHeader {
  mur_date: string;
  mur_file: string;
  units: "hours";
  variable: "dt_1km_data";
  variable_comment: string | null;
  grid: GridBlock<"uint8_hours"> & { nodata: number; no_look: number };
  summary: { ocean_cells: number; looked_share: number; median_hours: number };
}
