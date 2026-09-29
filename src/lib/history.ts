// Place History (plan H1): one place's monthly record. Bangladesh's four cities
// come from L1's Bangladesh files (heat from 1951; water is the national GRACE
// box); the other places from L1's global cube (contract §14).

import type { CompareSide } from "@/lib/audio-adapter/types";
import { layerSeries, type GlobalLayer } from "@/lib/data";
import type {
  ClimateCellName,
  GistempContextFile,
  GlobalPlace,
  GraceContextFile,
  RainConfidence,
  RainContextFile,
} from "@/types/data-contract";

export const PLACES: readonly ClimateCellName[] = ["Chattogram", "Dhaka", "Rajshahi", "Sylhet"];

export const HISTORY_METRICS = ["heat", "rain", "water"] as const;
export type HistoryMetric = (typeof HISTORY_METRICS)[number];

/** Which of L2's context voices plays each record. */
export const HISTORY_VOICE: Record<HistoryMetric, CompareSide["voice"]> = { heat: "heat", rain: "monsoon", water: "water" };

export interface BangladeshFiles {
  gistemp: GistempContextFile;
  gpcp: RainContextFile;
  grace: GraceContextFile;
}

/** Where a record comes from: a grid cell, or a named region (a GRACE box or 3° cell). */
export type RecordSource = { kind: "cell"; lat: number; lon: number; neighbour: boolean } | { kind: "region"; label: string | null };

export interface PlaceSeries {
  months: string[];
  values: (number | null)[]; // null = no measurement → silence
  dataset: string;
  source: RecordSource;
  /** Other places whose record here is the identical record (same cell or box). */
  sameRecord: string[];
  caveat: string | null;
  confidence: RainConfidence | null; // rain, world places only
}

const isBangladesh = (place: string): place is ClimateCellName => (PLACES as readonly string[]).includes(place);

function bangladeshSeries(metric: HistoryMetric, place: ClimateCellName, files: BangladeshFiles): PlaceSeries {
  if (metric === "water") {
    const box = files.grace.boxes.Bangladesh;
    // One national record: every city hears the same box.
    return { months: box.months, values: box.cm, dataset: files.grace.dataset, source: { kind: "region", label: null }, sameRecord: PLACES.filter((p) => p !== place), caveat: files.grace.gap_note, confidence: null };
  }
  const cell = metric === "heat" ? files.gistemp.cells[place] : files.gpcp.cells[place];
  const values = metric === "heat" ? files.gistemp.cells[place].anom_C : files.gpcp.cells[place].mm_per_day;
  const sameRecord = PLACES.filter((p) => {
    const other = metric === "heat" ? files.gistemp.cells[p] : files.gpcp.cells[p];
    return p !== place && other.lat === cell.lat && other.lon === cell.lon;
  });
  return {
    months: cell.months,
    values,
    dataset: metric === "heat" ? files.gistemp.dataset : files.gpcp.dataset,
    source: { kind: "cell", lat: cell.lat, lon: cell.lon, neighbour: false },
    sameRecord,
    caveat: metric === "rain" ? (files.gpcp.caveat ?? null) : null,
    confidence: null,
  };
}

/** The place's cell for a layer, and the places that share it (contract §14 fields). */
function worldRefs(place: GlobalPlace, metric: HistoryMetric) {
  if (metric === "heat") return { cell: place.heat_cell, shares: place.heat_shares_cell_with };
  if (metric === "rain") return { cell: place.rain_cell, shares: place.rain_shares_cell_with };
  return { cell: place.water_cell, shares: place.water_shares_cell_with };
}

function worldSeries(metric: HistoryMetric, place: GlobalPlace, layer: GlobalLayer): PlaceSeries | null {
  const { cell, shares } = worldRefs(place, metric);
  if (!cell) return null;
  return {
    months: layer.months,
    values: layerSeries(layer, cell.index),
    dataset: layer.meta.dataset,
    source: metric === "water" ? { kind: "region", label: place.water_region?.label ?? null } : { kind: "cell", lat: cell.lat, lon: cell.lon, neighbour: metric === "heat" && place.heat_cell_is_neighbour },
    sameRecord: shares,
    caveat: layer.meta.caveat ?? layer.meta.gap_note ?? null,
    confidence: metric === "rain" ? place.rain_confidence : null,
  };
}

/**
 * The record to show and play. Bangladesh cities read L1's Bangladesh files;
 * other places need their global layer (null until it has loaded).
 */
export function placeSeries(
  metric: HistoryMetric,
  place: string,
  bangladesh: BangladeshFiles,
  world: { places: GlobalPlace[]; layer: GlobalLayer | null },
): PlaceSeries | null {
  if (isBangladesh(place)) return bangladeshSeries(metric, place, bangladesh);
  const p = world.places.find((w) => w.name === place);
  if (!p || !world.layer || world.layer.meta.layer !== metric) return null;
  return worldSeries(metric, p, world.layer);
}

export { isBangladesh };

/** The decades a series covers completely, newest first ("2010"…"2019"). */
export function fullDecades(months: readonly string[]): number[] {
  const years = new Set(months.map((m) => Number(m.slice(0, 4))));
  const decades: number[] = [];
  for (let d = Math.floor(Math.min(...years) / 10) * 10; d <= Math.max(...years); d += 10) {
    if (Array.from({ length: 10 }, (_, k) => d + k).every((y) => years.has(y))) decades.push(d);
  }
  return decades.reverse();
}

/** Index range [start, end) of a decade's months within the series. */
export function decadeRange(months: readonly string[], decade: number): [number, number] {
  const start = months.findIndex((m) => Number(m.slice(0, 4)) === decade);
  const end = months.findIndex((m) => Number(m.slice(0, 4)) === decade + 10);
  return [start, end === -1 ? months.length : end];
}
