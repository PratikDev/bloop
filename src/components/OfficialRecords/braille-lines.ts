// The official and related records' braille lines, as pure functions (tested against every shipped manifest
// in src/a11y/strings.test.ts): values at the record's stated precision, units, places and times.

import { braillePlace, brailleNumber, brailleTime, brailleUnit, clean, decimalsFor, type DegreeStyle } from "@/a11y/brailleText";
import type { LatLon, OfficialReading } from "@/lib/data";
import type { BoundT } from "@/lib/i18n";
import type { OfficialLayer, OfficialStatus } from "@/types/data-contract";

/** Statuses whose values are not to be read as measurements: the value line says so first. */
export const RELATIVE: readonly OfficialStatus[] = ["relative", "pattern only", "visual texture"];
/** Points along the needle's latitude (at most one per grid column). */
export const PATH_MAX = 72;
/** The 3×3 spans a quarter of the layer's width, centred on the block the needle is in. */
export const GRID_SPAN = 4;

const SIGNIFICANT = 3;

/** A value at the record's stated precision: the quantisation step (linear), three significant digits (log). */
export function valueNumber(layer: OfficialLayer, v: number): string {
  if (layer.encoding === "log10") return brailleNumber(v, Math.max(0, SIGNIFICANT - 1 - Math.floor(Math.log10(Math.abs(v) || 1))));
  return brailleNumber(v, decimalsFor(layer.quantisation_step));
}

/** The unit as the value line writes it; a relative unit is dropped (the line already starts "relative"). */
export function unitOf(layer: OfficialLayer, degree: DegreeStyle): string {
  return /^relative/iu.test(layer.unit) ? "" : brailleUnit(layer.unit, degree);
}

export function readingText(t: BoundT, layer: OfficialLayer, r: OfficialReading | null, degree: DegreeStyle): string {
  if (!r) return t("braille.noData");
  const v = `${valueNumber(layer, r.value)} ${unitOf(layer, degree)}`.trim();
  return r.below ? t("braille.atOrBelow", { value: v }) : v;
}

export function placeText(t: BoundT, layer: OfficialLayer, at: LatLon): string {
  if (layer.grid.space !== "frame") return braillePlace(at.lat, at.lon);
  const [west, south, east, north] = layer.grid.bounds;
  const pct = (v: number, lo: number, hi: number) => brailleNumber((100 * (v - lo)) / (hi - lo), 0);
  return t("braille.frame", { x: pct(at.lon, west, east), y: pct(at.lat, south, north) });
}

export function timeText(layer: OfficialLayer, step: number): string {
  const label = layer.time_labels?.[step];
  return label ? clean(label) : layer.times[step] ? brailleTime(layer.times[step], true) : "";
}
