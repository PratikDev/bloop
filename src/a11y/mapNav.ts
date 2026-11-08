// The map widget's keyboard navigation (accessibility core, step 2; docs/accessibility/CORE_PLAN.md): cell size (+/−),
// the iSonic-style 3×3 region jump (J, then 1–9), and the trail "." walks back along. Pure, so it is unit-tested.
import { clampLat, wrapLon, type LatLon } from "@/lib/data";
import type { MessageKey } from "@/lib/i18n";

/** Step sizes the arrow keys move by, in degrees (+ and − walk this list). 1° is the app's original step. */
export const CELL_SIZES = [0.25, 0.5, 1, 2, 5] as const;
export const DEFAULT_CELL = 1;

/** The next cell size up (+1) or down (−1), staying at the ends. */
export function nextCellSize(current: number, dir: 1 | -1): number {
  const at = CELL_SIZES.findIndex((s) => s === current);
  const i = at === -1 ? CELL_SIZES.indexOf(DEFAULT_CELL) : at;
  return CELL_SIZES[Math.min(CELL_SIZES.length - 1, Math.max(0, i + dir))];
}

/** A box on the map, in degrees (west < east; the map view never wraps the antimeridian). */
export interface Bounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

/** Listen's map: the whole equirectangular frame. */
export const WHOLE_MAP: Bounds = {
  south: -90,
  north: 90,
  west: -180,
  east: 180,
};

/** The nine regions, by the number that picks them: numpad layout (7 8 9 = north row, 1 2 3 = south row). */
export const REGION_NAMES = [
  "southWest",
  "south",
  "southEast",
  "west",
  "centre",
  "east",
  "northWest",
  "north",
  "northEast",
] as const;
export type RegionName = (typeof REGION_NAMES)[number];

/** Each region's name as said ("north-west"), for the map keys and the descriptions. */
export const REGION_LABEL = {
  southWest: "region.southWest",
  south: "region.south",
  southEast: "region.southEast",
  west: "region.west",
  centre: "region.centre",
  east: "region.east",
  northWest: "region.northWest",
  north: "region.north",
  northEast: "region.northEast",
} as const satisfies Record<RegionName, MessageKey>;

/** The region a number 1–9 picks inside `view`, or null for any other key. */
export function regionOf(view: Bounds, key: string): { name: RegionName; bounds: Bounds } | null {
  if (!/^[1-9]$/u.test(key)) return null;
  const n = Number(key) - 1;
  const row = Math.floor(n / 3); // 0 = south row
  const col = n % 3; // 0 = west column
  const dLat = (view.north - view.south) / 3;
  const dLon = (view.east - view.west) / 3;
  const south = view.south + row * dLat;
  const west = view.west + col * dLon;
  return {
    name: REGION_NAMES[n],
    bounds: { south, north: south + dLat, west, east: west + dLon },
  };
}

/** The centre of a box, where a jump puts the needle. */
export function centreOf(b: Bounds): LatLon {
  return {
    lat: clampLat((b.south + b.north) / 2),
    lon: wrapLon((b.west + b.east) / 2),
  };
}

/** How many earlier places "." can go back to. */
export const TRAIL_MAX = 50;

/** The trail with `from` added (if it is a new place), keeping the newest TRAIL_MAX. */
export function remember(trail: readonly LatLon[], from: LatLon): LatLon[] {
  const last = trail[trail.length - 1];
  if (last && last.lat === from.lat && last.lon === from.lon) return [...trail];
  return [...trail, from].slice(-TRAIL_MAX);
}

/**
 * The time-lapse frame PageUp (+1, newer) or PageDown (−1, older) moves to: `held` null is the live frame, after the
 * newest; "edge" when there is nothing further that way (the caller says so).
 */
export function frameAfter(held: number | null, dir: 1 | -1, frames: number): number | null | "edge" {
  const newest = frames - 1;
  if (newest < 0) return "edge";
  if (held === null) return dir === -1 ? newest : "edge";
  if (dir === 1) return held >= newest ? null : held + 1;
  return held <= 0 ? "edge" : held - 1;
}
