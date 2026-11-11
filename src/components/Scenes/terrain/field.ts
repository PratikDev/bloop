// Sound terrain's region of today's SST grid: the cells inside the region, the
// zoomed axis (the region's own min and max, rounded outward to whole degrees)
// and the warmest cell (the hunt's answer, so it can be checked against the grid).

import { cellIndex, rowLat } from "@/lib/data/grid";
import { decodeSst } from "@/lib/data/latest";
import type { SstField } from "@/lib/data";
import type { Bounds } from "../plane";

/** The scene's region: the Bay of Bengal and the northern Indian Ocean (west, south, east, north). */
export const TERRAIN_REGION: Bounds = [78, 5, 100, 25];

export interface TerrainField {
  bounds: Bounds;
  /** Grid rows/columns covering the region (north to south, west to east). */
  rows: number[];
  cols: number[];
  /** °C per [row][col] of the region (null = land / no data). */
  values: (number | null)[][];
  lats: number[];
  lons: number[];
  min: number;
  max: number;
  axis: { min: number; max: number };
  warmest: { lat: number; lon: number; valueC: number; cell: number };
}

const colLon = (width: number, col: number) => -180 + ((col + 0.5) / width) * 360;

export function terrainField(sst: SstField, bounds: Bounds = TERRAIN_REGION): TerrainField | null {
  const { width, height } = sst.meta.grid;
  const [w, s, e, n] = bounds;
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < height; r++) if (rowLat(sst.meta.grid, r) >= s && rowLat(sst.meta.grid, r) <= n) rows.push(r);
  for (let c = 0; c < width; c++) if (colLon(width, c) >= w && colLon(width, c) <= e) cols.push(c);
  let min = Infinity;
  let max = -Infinity;
  let warmest: TerrainField["warmest"] | null = null;
  const values = rows.map((r) =>
    cols.map((c) => {
      const v = decodeSst(sst.meta, sst.codes[r * width + c]);
      if (v === null) return null;
      min = Math.min(min, v);
      if (v > max) {
        max = v;
        warmest = { lat: rowLat(sst.meta.grid, r), lon: colLon(width, c), valueC: v, cell: r * width + c };
      }
      return v;
    }),
  );
  if (!warmest) return null;
  return {
    bounds,
    rows,
    cols,
    values,
    lats: rows.map((r) => rowLat(sst.meta.grid, r)),
    lons: cols.map((c) => colLon(width, c)),
    min,
    max,
    axis: { min: Math.floor(min), max: Math.ceil(max) },
    warmest,
  };
}

/** The grid cell at a point (the same lookup as valueAt). */
export const sstCell = (sst: SstField, lat: number, lon: number) => cellIndex(sst.meta.grid, lat, lon);
