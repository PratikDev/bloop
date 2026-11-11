import type { LatLon } from "@/lib/data";
import { cellCentre, cellIdAt, cubeValue, monthIndexOf, type GlobalLayer } from "@/lib/data/global";
import type { GlobalLayerName } from "@/types/data-contract";

export const COMPARE_LAYERS = ["heat", "rain", "water"] as const satisfies readonly GlobalLayerName[];
export type CompareLayer = (typeof COMPARE_LAYERS)[number];

export const COMPARE_VOICE = { heat: "heat", rain: "monsoon", water: "water" } as const satisfies Record<CompareLayer, string>;
export const BEATS: Record<CompareLayer, boolean> = { heat: true, rain: false, water: true };

interface CompareSideValue {
  month: string; // "YYYY-MM"
  value: number | null;
}

export interface CompareResult {
  layer: CompareLayer;
  cell: LatLon;
  a: CompareSideValue;
  b: CompareSideValue;
  diff: number | null;
}

export function compareAt(layer: GlobalLayer, name: CompareLayer, at: LatLon, a: string, b: string): CompareResult {
  const id = cellIdAt(layer.meta, at.lat, at.lon);
  const row = layer.rowOf[id] ?? -1;
  const side = (month: string): CompareSideValue => ({ month, value: cubeValue(layer, row, monthIndexOf(layer, month)) });
  const [sa, sb] = [side(a), side(b)];
  return { layer: name, cell: cellCentre(layer.meta, id), a: sa, b: sb, diff: sa.value === null || sb.value === null ? null : sb.value - sa.value };
}

export function defaultMonths(layer: GlobalLayer): { a: string; b: string } {
  const b = layer.months[layer.months.length - 1];
  const first = layer.months.find((m) => m.slice(5) === b.slice(5)) ?? layer.months[0];
  return { a: first, b };
}

export function layerYears(layer: GlobalLayer): number[] {
  const years = new Set(layer.months.map((m) => Number(m.slice(0, 4))));
  return [...years].sort((x, y) => x - y);
}
