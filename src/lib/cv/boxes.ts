import type { LatLon } from "@/lib/data";
import { clampLat, wrapLon } from "@/lib/data/grid";
import { SPAN_DEG } from "@/lib/describe/stats";
import file from "./boxes.json";

export type Bounds = readonly [number, number, number, number];

export interface NamedBox {
  id: string;
  name: string;
  bounds: Bounds;
}

export const NAMED_BOXES: readonly NamedBox[] = file.boxes.map((b) => ({ id: b.id, name: b.name, bounds: [b.bounds[0], b.bounds[1], b.bounds[2], b.bounds[3]] }));

export const NEEDLE_BOX = "needle";
export const BOX_IDS: readonly string[] = [NEEDLE_BOX, ...NAMED_BOXES.map((b) => b.id)];

function needleBounds(at: LatLon, spanDeg: number = SPAN_DEG): Bounds {
  const h = spanDeg / 2;
  return [wrapLon(at.lon - h), clampLat(at.lat - h), wrapLon(at.lon + h), clampLat(at.lat + h)];
}

export function boundsOf(id: string, at: LatLon): Bounds {
  return NAMED_BOXES.find((b) => b.id === id)?.bounds ?? needleBounds(at);
}
