// A regional map laid flat for the delta and terrain scenes: one unit = one
// degree of latitude, east = +x (scaled by cos of the centre latitude), north
// = −z, up = +y. Every position in those scenes goes through here.

import type { LatLon } from "@/lib/data";

/** [west, south, east, north] in degrees. */
export type Bounds = [number, number, number, number];

export interface GeoPlane {
  bounds: Bounds;
  centre: LatLon;
  /** Width and depth in scene units. */
  size: { x: number; z: number };
  toXZ(lat: number, lon: number): { x: number; z: number };
  toLatLon(x: number, z: number): LatLon;
  contains(lat: number, lon: number): boolean;
}

/** Metres of height → scene units, with a stated vertical exaggeration. */
export const METRES_PER_DEGREE = 111_000;

export function geoPlane(bounds: Bounds): GeoPlane {
  const [w, s, e, n] = bounds;
  const centre = { lat: (s + n) / 2, lon: (w + e) / 2 };
  const kx = Math.cos((centre.lat * Math.PI) / 180);
  return {
    bounds,
    centre,
    size: { x: (e - w) * kx, z: n - s },
    toXZ: (lat, lon) => ({ x: (lon - centre.lon) * kx, z: -(lat - centre.lat) }),
    toLatLon: (x, z) => ({ lat: centre.lat - z, lon: centre.lon + x / kx }),
    contains: (lat, lon) => lat >= s && lat <= n && lon >= w && lon <= e,
  };
}
