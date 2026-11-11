// An official or related record's braille reading, as a pure function (tested against every shipped manifest in
// src/a11y/strings.test.ts): the value at the record's stated precision, its unit, place, time and status.
// src/a11y/brailleLines.ts draws the value and review lines from it.

import type { BrailleReading } from "@/a11y/brailleLines";
import { clean, decimalsFor, shortNameOf } from "@/a11y/brailleText";
import { PATTERN_ONLY, patternLevel, type LatLon, type OfficialReading } from "@/lib/data";
import type { OfficialLayer, OfficialManifest, OfficialStatus } from "@/types/data-contract";

/** Statuses whose values are not to be read as measurements: the value line says so first. */
export const RELATIVE: readonly OfficialStatus[] = ["relative", "pattern only", "visual texture"];
/** Points along the needle's latitude (at most one per grid column). */
export const PATH_MAX = 72;
/** The 3×3 spans a quarter of the layer's width, centred on the block the needle is in. */
export const GRID_SPAN = 4;

const SIGNIFICANT = 3;
/** Layer ids that name nothing (one-layer related records): the short line names the SVS ID instead. */
const GENERIC = /^(value|series|svs\d+)$/u;

/** The short name: the layer's own words ("sea salt"), a GIBS layer's label head ("Night lights"), or the SVS ID. */
function shortName(layer: OfficialLayer, svs: number | undefined): string {
  if (GENERIC.test(layer.id)) return svs === undefined ? clean(layer.label.split(" (")[0]) : String(svs);
  if (/[A-Z]/u.test(layer.id)) return shortNameOf(layer.label.split(/ \(| —|,/u)[0]);
  return clean(layer.id.replace(/_/gu, " "));
}

/** The record's stated precision: its quantisation step (linear), three significant digits (log). */
export function decimalsOf(layer: OfficialLayer, v: number): number {
  if (layer.encoding === "log10") return Math.max(0, SIGNIFICANT - 1 - Math.floor(Math.log10(Math.abs(v) || 1)));
  return decimalsFor(layer.quantisation_step);
}

/** What the needle is on in one layer at one time step. */
export function officialReading(manifest: OfficialManifest, layer: OfficialLayer, r: OfficialReading | null, at: LatLon, step: number): BrailleReading {
  const svs = manifest.svs_ids[0] as number | undefined;
  const short = shortName(layer, svs);
  const [west, south, east, north] = layer.grid.bounds;
  const place = layer.grid.space === "frame"
    ? { x: (100 * (at.lon - west)) / (east - west), y: (100 * (at.lat - south)) / (north - south) }
    : { lat: at.lat, lon: at.lon };
  return {
    short,
    long: clean(svs === undefined ? layer.label : `SVS ${svs} ${layer.label}`),
    layer: layer.id,
    svs,
    tag: svs !== undefined && short !== String(svs) ? String(svs) : undefined,
    kind: !r ? "nodata" : layer.status === PATTERN_ONLY ? "pattern" : "value",
    value: r && layer.status !== PATTERN_ONLY ? r.value : null,
    level: r && layer.status === PATTERN_ONLY ? patternLevel(layer, r.value) : undefined,
    decimals: r ? decimalsOf(layer, r.value) : 0,
    below: r?.below ?? false,
    snow: false,
    unit: layer.unit,
    place,
    time: { iso: layer.times[step] ?? null, label: layer.time_labels?.[step] ?? null },
    badge: manifest.badge,
    status: layer.status,
    relative: RELATIVE.includes(layer.status),
  };
}
