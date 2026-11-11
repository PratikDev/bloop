// The view boxes the "What the jukebox read" panel and the value chord read: the needle's neighbourhood (the same
// span as the describe facts' 3×3 cells, stats.ts SPAN_DEG) and the named boxes in boxes.json (one source, shared
// with pipeline/tests/test_box_stats.py).
import type { LatLon } from "@/lib/data";
import { clampLat, wrapLon } from "@/lib/data/grid";
import { SPAN_DEG } from "@/lib/describe/stats";
import file from "./boxes.json";

/** [west, south, east, north] in degrees; west > east means the box crosses 180°. */
export type Bounds = readonly [number, number, number, number];

export interface NamedBox {
  id: string;
  name: string;
  bounds: Bounds;
}

export const NAMED_BOXES: readonly NamedBox[] = file.boxes.map((b) => ({ id: b.id, name: b.name, bounds: [b.bounds[0], b.bounds[1], b.bounds[2], b.bounds[3]] }));

/** The needle's own box id (its bounds follow the needle). */
export const NEEDLE_BOX = "needle";
export const BOX_IDS: readonly string[] = [NEEDLE_BOX, ...NAMED_BOXES.map((b) => b.id)];

/** The SPAN_DEG × SPAN_DEG box centred on the needle (latitudes clamped, longitudes wrapped). */
function needleBounds(at: LatLon, spanDeg: number = SPAN_DEG): Bounds {
  const h = spanDeg / 2;
  return [wrapLon(at.lon - h), clampLat(at.lat - h), wrapLon(at.lon + h), clampLat(at.lat + h)];
}

/** A box's bounds by id: the needle's box around `at`, or a named box. */
export function boundsOf(id: string, at: LatLon): Bounds {
  return NAMED_BOXES.find((b) => b.id === id)?.bounds ?? needleBounds(at);
}
