// The global history cube, global/* (section 14). Re-exported from src/types/data-contract.ts.

// ---------------------------------------------------------------------------
// 14. Global history cube (global/*) — OPTIONAL, additive
// Needed by: L3 (click anywhere / place picker → reuse the History chart);
// L2 (same three voices as the ensemble, file 11). Built by build_global.py
// from files already used for 4–5 (global versions); no new downloads.
// Load lazily (only when the user opens the global view): about 10–15 MB total.
// <layer>.i16.gz — gzip of Int16 little-endian, [cell][month] row-major:
//   value = int16 / scale; -32768 = no data → silence.
//   cell_id = row × grid.lon.length + col (row 0 = northernmost, col 0 = westernmost);
//   cells[k] is the cell_id of row k in the data; month m = month_start + m.
// heat = land only (oceans silent). Water months with two GRACE solutions are
// averaged and listed in duplicate_months_averaged. Values never exceed int16:
// build_global.py fails (and publishes nothing) if any value would be clipped.
// Cross-checking: only Dhaka's April–May heat and June–September rain (demo,
// file 9) were cross-checked against independent records. The ANNUAL values
// in places.json were not separately cross-checked; label them "annual".
// Water per place: Bangladesh places use the national box (the same record as the
// demo); other places use their 3° GRACE cell (water_region.label says which).
// ---------------------------------------------------------------------------

export type GlobalLayerName = "heat" | "rain" | "water";

export interface GlobalLayerFile {
  layer: GlobalLayerName;
  file: string; // "heat.i16.gz"
  compression: "gzip";
  dtype: string; // "int16 little-endian"
  layout: string;
  scale: number; // heat 100, rain 100, water 10
  month_start: string; // "YYYY-MM"
  n_months: number;
  grid: { lat: number[]; lon: number[]; cell_id: string };
  cells: number[];
  units: string;
  dataset: string;
  credit: string;
  caveat?: string; // rain
  gap_note?: string; // water
  duplicate_months_averaged?: string[]; // water
}

export type RainConfidence = "high" | "medium" | "low" | "satellite-only";

export interface GlobalConfidenceFile {
  layer: "rain";
  method: string;
  flags: Record<string, RainConfidence>; // key = rain cell_id as a string
}

export interface GlobalCellRef {
  index: number; // row in the layer's data (not the cell_id)
  lat: number;
  lon: number;
}

interface GlobalWaterRegion {
  kind: "box" | "cell"; // "box" = Bangladesh national box (same record as the demo); "cell" = the place's 3° GRACE cell
  label: string; // e.g. "3° GRACE cell 27°N–30°N, 72°E–75°E"
}

export interface GlobalPlace {
  name: string;
  lat: number;
  lon: number;
  in_bangladesh: boolean;
  heat_cell: GlobalCellRef | null;
  heat_cell_is_neighbour: boolean; // true = nearest land cell, not the place's own cell (coasts/islands)
  rain_cell: GlobalCellRef | null;
  water_cell: GlobalCellRef | null; // null for Bangladesh places (they use the national box, see water_region)
  water_region: GlobalWaterRegion | null;
  // ANNUAL values (see GlobalPlacesFile.basis). For Bangladesh cities these differ on purpose from the demo /
  // cities files (April–May heat, June–September rain): always label them "annual" in the UI.
  heat_annual_then_now: [number | null, number | null] | null; // °C anomaly, 1981–1990 vs 2016–2025
  rain_annual_then_now: [number | null, number | null] | null; // mm/day, same windows
  rain_confidence: RainConfidence | null;
  water_then_now: [number | null, number | null] | null; // cm, 2003–06 vs 2021–24 (Bangladesh: = demo water)
  // Places in the same grid cell (or the same box) are the same record — don't present them as separate findings.
  // *_same_record_as = the first listed place with that cell/box (null for the reference place or when not shared).
  heat_shares_cell_with: string[];
  heat_same_record_as: string | null;
  rain_shares_cell_with: string[];
  rain_same_record_as: string | null;
  water_shares_cell_with: string[];
  water_same_record_as: string | null;
}

export interface GlobalPlacesFile {
  note: string;
  basis: { heat: string; rain: string; water: string };
  demo_note: string; // why Bangladesh values differ from the Section 16 demo
  places: GlobalPlace[];
}

export interface GlobalManifest {
  layers: GlobalLayerName[];
  files: string[];
  generated_utc: string;
  disclosure: string;
}
