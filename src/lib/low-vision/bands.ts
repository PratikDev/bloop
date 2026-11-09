// PURE: discrete value bands for the low-vision map and the Context Lens (accessibility core, step 8; spec 4.1, 4.2).
// The bands re-draw the decoded values the sound plays with sharp edges, and each band is labelled with its range;
// labels go in the middle of the map's tiles where one band fills most of the tile, at a cell whose value is in it.
import type { ValueGrid } from "@/lib/describe/stats";
import { cellCentre } from "@/lib/describe/stats";
import type { BandCount } from "./settings";

export type BandRecord = "ocean" | "rain";
export type ShownBands = Exclude<BandCount, 0>;

export interface Band {
  lo: number;
  /** null: open-ended ("and more"). */
  hi: number | null;
}

/** Rain's lower band edges in mm/h, on a roughly logarithmic ladder (design choice: drizzle to downpour); 0 is dry. */
const RAIN_EDGES: Record<ShownBands, readonly number[]> = {
  5: [0, 0.5, 2, 5, 10],
  7: [0, 0.25, 0.5, 1, 2.5, 5, 10],
  10: [0, 0.1, 0.25, 0.5, 1, 2, 4, 8, 16, 32],
};

/** The bands the lens draws when the map itself has none. */
export const LENS_BANDS: ShownBands = 7;

/** The finite values of a grid, lowest and highest (null when it has none). */
export function valueRange(g: ValueGrid): { min: number; max: number } | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < g.width * g.height; i++) {
    const v = g.value(i);
    if (v === null) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return min <= max ? { min, max } : null;
}

/** Ocean: `n` equal bands of whole degrees from the coldest water down to a whole degree, covering the warmest. */
export function oceanBands(range: { min: number; max: number }, n: ShownBands): Band[] {
  const lo = Math.floor(range.min);
  const step = Math.max(1, Math.ceil((range.max - lo) / n + Number.EPSILON));
  return Array.from({ length: n }, (_, i) => ({ lo: lo + i * step, hi: lo + (i + 1) * step }));
}

/** Rain: the ladder's bands; the top one is open-ended. */
export function rainBands(n: ShownBands): Band[] {
  const edges = RAIN_EDGES[n];
  return edges.map((lo, i) => ({ lo, hi: edges[i + 1] ?? null }));
}

export function bandsFor(record: BandRecord, g: ValueGrid, n: ShownBands): Band[] {
  if (record === "rain") return rainBands(n);
  const range = valueRange(g);
  return range ? oceanBands(range, n) : [];
}

/** The band a value is in (lower edge included), or -1: no data, or dry rain (0 mm/h is no band: nothing falls). */
export function bandIndex(bands: readonly Band[], record: BandRecord, v: number | null): number {
  if (v === null || (record === "rain" && v <= 0)) return -1;
  for (let i = bands.length - 1; i >= 0; i--) if (v >= bands[i].lo) return i;
  return bands.length ? 0 : -1;
}

export interface BandLabel {
  band: number;
  /** The cell the label sits on (its value is in the band). */
  cell: number;
  lat: number;
  lon: number;
}

/** The share of a tile one band must fill for its label to go there (design choice: "where it fits"). */
export const LABEL_SHARE = 0.6;

/** A block of grid cells: columns c0 to c1 and rows r0 to r1 (ends exclusive; fractions allowed). */
export interface CellRegion {
  c0: number;
  r0: number;
  c1: number;
  r1: number;
}

/**
 * One label per tile (tilesX × tilesY over `region`, the whole map by default; the Context Lens passes the part it
 * magnifies) where one band fills at least LABEL_SHARE of its cells. The region is clipped to the grid.
 */
export function bandLabels(g: ValueGrid, bands: readonly Band[], record: BandRecord, tilesX: number, tilesY: number, region?: CellRegion): BandLabel[] {
  const labels: BandLabel[] = [];
  const left = Math.max(0, region?.c0 ?? 0);
  const top = Math.max(0, region?.r0 ?? 0);
  const tw = (Math.min(g.width, region?.c1 ?? g.width) - left) / tilesX;
  const th = (Math.min(g.height, region?.r1 ?? g.height) - top) / tilesY;
  if (tw <= 0 || th <= 0) return labels;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const counts = new Map<number, number>();
      let cells = 0;
      const r0 = Math.floor(top + ty * th);
      const r1 = Math.floor(top + (ty + 1) * th);
      const c0 = Math.floor(left + tx * tw);
      const c1 = Math.floor(left + (tx + 1) * tw);
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          cells++;
          const b = bandIndex(bands, record, g.value(r * g.width + c));
          if (b !== -1) counts.set(b, (counts.get(b) ?? 0) + 1);
        }
      }
      const [band, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [-1, 0];
      if (band === -1 || n < LABEL_SHARE * cells) continue;
      // The cell nearest the tile's centre whose value is in the band.
      const cr = (r0 + r1) / 2;
      const cc = (c0 + c1) / 2;
      let best = -1;
      let bestD = Number.POSITIVE_INFINITY;
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          const i = r * g.width + c;
          if (bandIndex(bands, record, g.value(i)) !== band) continue;
          const d = (r - cr) ** 2 + (c - cc) ** 2;
          if (d < bestD) [best, bestD] = [i, d];
        }
      }
      if (best !== -1) labels.push({ band, cell: best, ...cellCentre(g, best) });
    }
  }
  return labels;
}
