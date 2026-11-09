// "Compare two dates" (accessibility core, step 6; spec Part 1.9): the same place at two times, from the monthly global
// layers (GISTEMP land temperature, GPCP rain, GRACE water) at the cell around the needle. The difference is computed
// here and said exactly; the sound plays both values by the layer's own rule (two tones beating in one ear for the
// pitch rules, one after the other for rain's drops).
import type { LatLon } from "@/lib/data";
import { cellCentre, cellIdAt, cubeValue, monthIndexOf, type GlobalLayer } from "@/lib/data/global";
import type { GlobalLayerName } from "@/types/data-contract";

/** The layers that can be compared, in the order the picker lists them. */
export const COMPARE_LAYERS = ["heat", "rain", "water"] as const satisfies readonly GlobalLayerName[];
export type CompareLayer = (typeof COMPARE_LAYERS)[number];

/** Each layer's sound rule (mapping.json voice): heat and water are pitch, so their two dates beat; rain is drops. */
export const COMPARE_VOICE = { heat: "heat", rain: "monsoon", water: "water" } as const satisfies Record<CompareLayer, string>;
export const BEATS: Record<CompareLayer, boolean> = { heat: true, rain: false, water: true };

export interface CompareSideValue {
  month: string; // "YYYY-MM"
  value: number | null;
}

export interface CompareResult {
  layer: CompareLayer;
  /** The centre of the layer's cell around the needle (the value belongs to the whole cell). */
  cell: LatLon;
  a: CompareSideValue;
  b: CompareSideValue;
  /** b − a, or null when either side has no data. */
  diff: number | null;
}

/** The cell's row in the layer, or −1 when the layer has no data there (ocean, for land temperature). */
export function rowAt(layer: GlobalLayer, at: LatLon): number {
  return layer.rowOf[cellIdAt(layer.meta, at.lat, at.lon)] ?? -1;
}

export function compareAt(layer: GlobalLayer, name: CompareLayer, at: LatLon, a: string, b: string): CompareResult {
  const id = cellIdAt(layer.meta, at.lat, at.lon);
  const row = layer.rowOf[id] ?? -1;
  const side = (month: string): CompareSideValue => ({ month, value: cubeValue(layer, row, monthIndexOf(layer, month)) });
  const [sa, sb] = [side(a), side(b)];
  return { layer: name, cell: cellCentre(layer.meta, id), a: sa, b: sb, diff: sa.value === null || sb.value === null ? null : sb.value - sa.value };
}

/** The default pair: the layer's newest month, and the same calendar month in its first year (seasons cancel out). */
export function defaultMonths(layer: GlobalLayer): { a: string; b: string } {
  const b = layer.months[layer.months.length - 1];
  const first = layer.months.find((m) => m.slice(5) === b.slice(5)) ?? layer.months[0];
  return { a: first, b };
}

/** The years the layer covers (for the year pickers). */
export function layerYears(layer: GlobalLayer): number[] {
  const years = new Set(layer.months.map((m) => Number(m.slice(0, 4))));
  return [...years].sort((x, y) => x - y);
}
