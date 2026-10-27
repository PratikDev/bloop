// Ghost Earths: the then and now window means per cell, from the global cube.
// Windows are the data's own: heat and rain use the demo's 1981–1990 vs
// 2016–2025 (dhaka_then_now.json), water uses GRACE's 2003–2006 vs 2021–2024
// (grace.json). The mean is places.json's basis: the mean of the months present.

import { cellIdAt, monthlyRun, windowMean, type GlobalLayer } from "@/lib/data/global";
import type { DhakaThenNowDemo, GlobalLayerName, GlobalPlace, GlobalPlacesFile, GraceContextFile } from "@/types/data-contract";

export interface MonthWindow {
  from: string; // "YYYY-MM"
  to: string;
  /** "1981–1990", "2003–2006" */
  label: string;
}

export type GhostWindows = Record<GlobalLayerName, { A: MonthWindow; B: MonthWindow }>;

const yearsWindow = ([a, b]: [number, number]): MonthWindow => ({ from: `${a}-01`, to: `${b}-12`, label: `${a}–${b}` });
const graceWindow = (s: string): MonthWindow => {
  const [from, to] = s.split("..");
  return { from, to, label: `${from.slice(0, 4)}–${to.slice(0, 4)}` };
};

export function ghostWindows(demo: DhakaThenNowDemo, grace: GraceContextFile): GhostWindows {
  const heat = { A: yearsWindow(demo.heat.A.window), B: yearsWindow(demo.heat.B.window) };
  const rain = { A: yearsWindow(demo.rain.gpcp.A.window), B: yearsWindow(demo.rain.gpcp.B.window) };
  const box = grace.boxes.Bangladesh;
  return { heat, rain, water: { A: graceWindow(box.window_A), B: graceWindow(box.window_B) } };
}

/** Then and now per cell_id (NaN = no data in that window). */
export interface GhostField {
  layer: GlobalLayer;
  windows: { A: MonthWindow; B: MonthWindow };
  then: Float64Array;
  now: Float64Array;
}

export function buildField(layer: GlobalLayer, windows: { A: MonthWindow; B: MonthWindow }): GhostField {
  const n = layer.rowOf.length;
  const then = new Float64Array(n).fill(NaN);
  const now = new Float64Array(n).fill(NaN);
  for (let id = 0; id < n; id++) {
    const row = layer.rowOf[id];
    if (row < 0) continue;
    then[id] = windowMean(layer, row, windows.A.from, windows.A.to) ?? NaN;
    now[id] = windowMean(layer, row, windows.B.from, windows.B.to) ?? NaN;
  }
  return { layer, windows, then, now };
}

/** The cube's rounding (places.json: two decimals). */
export const round2 = (v: number) => Math.round(v * 100) / 100;

export interface GhostReading {
  cellId: number;
  then: number | null;
  now: number | null;
  /** now − then from the rounded values (what the chip shows), or null. */
  change: number | null;
  /** A places.json place in this cell: its own numbers are shown. */
  place: GlobalPlace | null;
}

const PLACE_VALUES: Record<GlobalLayerName, (p: GlobalPlace) => [number | null, number | null] | null> = {
  heat: (p) => p.heat_annual_then_now,
  rain: (p) => p.rain_annual_then_now,
  water: (p) => p.water_then_now,
};

const PLACE_CELL: Record<GlobalLayerName, (p: GlobalPlace) => { lat: number; lon: number } | null> = {
  heat: (p) => p.heat_cell,
  rain: (p) => p.rain_cell,
  water: (p) => p.water_cell,
};

const num = (v: number) => (Number.isNaN(v) ? null : round2(v));

/** The reading at a point: the cell's window means, or a named place's own published numbers. */
export function readGhost(field: GhostField, name: GlobalLayerName, places: GlobalPlacesFile | null, lat: number, lon: number): GhostReading {
  const cellId = cellIdAt(field.layer.meta, lat, lon);
  const place =
    places?.places.find((p) => {
      const c = PLACE_CELL[name](p);
      return c !== null && cellIdAt(field.layer.meta, c.lat, c.lon) === cellId && PLACE_VALUES[name](p) !== null;
    }) ?? null;
  const published = place ? PLACE_VALUES[name](place) : null;
  const then = published ? published[0] : num(field.then[cellId]);
  const now = published ? published[1] : num(field.now[cellId]);
  return { cellId, then, now, change: then !== null && now !== null ? round2(now - then) : null, place };
}

/** One value per year (that year's mean of the months present), for the then and now windows' sound. */
export function yearlyValues(field: GhostField, cellId: number, w: MonthWindow): (number | null)[] {
  const row = field.layer.rowOf[cellId];
  const out: (number | null)[] = [];
  for (let y = Number(w.from.slice(0, 4)); y <= Number(w.to.slice(0, 4)); y++) out.push(row < 0 ? null : windowMean(field.layer, row, `${y}-01`, `${y}-12`));
  return out;
}

/** The window's monthly values (water plays months, with its missing months). */
export function monthlyValues(field: GhostField, cellId: number, w: MonthWindow) {
  const row = field.layer.rowOf[cellId];
  return monthlyRun(field.layer, row, w.from, w.to);
}

/**
 * Quick check: every place in places.json against the cube's window means at
 * the place's own cell (rounded like places.json). Returns the mismatches.
 */
export function placesMismatches(field: GhostField, name: GlobalLayerName, places: GlobalPlacesFile): string[] {
  const out: string[] = [];
  for (const p of places.places) {
    const cell = PLACE_CELL[name](p);
    const published = PLACE_VALUES[name](p);
    if (!cell || !published) continue;
    const id = cellIdAt(field.layer.meta, cell.lat, cell.lon);
    const got = [num(field.then[id]), num(field.now[id])];
    if (got[0] !== published[0] || got[1] !== published[1]) out.push(`${p.name}: cube ${got.join(" → ")} vs places ${published.join(" → ")}`);
  }
  return out;
}
