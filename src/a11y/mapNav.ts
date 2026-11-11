import { clampLat, wrapLon, type LatLon } from "@/lib/data";
import type { MessageKey } from "@/lib/i18n";

const CELL_SIZES = [0.25, 0.5, 1, 2, 5] as const;
export const DEFAULT_CELL = 1;

export function nextCellSize(current: number, dir: 1 | -1): number {
  const at = CELL_SIZES.findIndex((s) => s === current);
  const i = at === -1 ? CELL_SIZES.indexOf(DEFAULT_CELL) : at;
  return CELL_SIZES[Math.min(CELL_SIZES.length - 1, Math.max(0, i + dir))];
}

export interface Bounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export const WHOLE_MAP: Bounds = {
  south: -90,
  north: 90,
  west: -180,
  east: 180,
};

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

export function regionOf(view: Bounds, key: string): { name: RegionName; bounds: Bounds } | null {
  if (!/^[1-9]$/u.test(key)) return null;
  const n = Number(key) - 1;
  const row = Math.floor(n / 3);
  const col = n % 3;
  const dLat = (view.north - view.south) / 3;
  const dLon = (view.east - view.west) / 3;
  const south = view.south + row * dLat;
  const west = view.west + col * dLon;
  return {
    name: REGION_NAMES[n],
    bounds: { south, north: south + dLat, west, east: west + dLon },
  };
}

export function centreOf(b: Bounds): LatLon {
  return {
    lat: clampLat((b.south + b.north) / 2),
    lon: wrapLon((b.west + b.east) / 2),
  };
}

const TRAIL_MAX = 50;

export function remember(trail: readonly LatLon[], from: LatLon): LatLon[] {
  const last = trail[trail.length - 1];
  if (last && last.lat === from.lat && last.lon === from.lon) return [...trail];
  return [...trail, from].slice(-TRAIL_MAX);
}

export function frameAfter(held: number | null, dir: 1 | -1, frames: number): number | null | "edge" {
  const newest = frames - 1;
  if (newest < 0) return "edge";
  if (held === null) return dir === -1 ? newest : "edge";
  if (dir === 1) return held >= newest ? null : held + 1;
  return held <= 0 ? "edge" : held - 1;
}

export const TABLE_REACH = 2;

export function tableAxes(at: LatLon, stepDeg: number, reach: number = TABLE_REACH): { lats: number[]; lons: number[] } {
  const offsets = Array.from({ length: reach * 2 + 1 }, (_, i) => i - reach);
  return {
    lats: offsets.map((k) => clampLat(at.lat - k * stepDeg)),
    lons: offsets.map((k) => wrapLon(at.lon + k * stepDeg)),
  };
}
