// Distances and directions on the Earth (mean radius), for "140 km S of Khulna".

import type { LatLon } from "@/lib/data/places";

const RAD = Math.PI / 180;
export const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km (haversine). */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `from` to `to`, degrees clockwise from north, [0, 360). */
export function bearingDeg(from: LatLon, to: LatLon): number {
  const φ1 = from.lat * RAD;
  const φ2 = to.lat * RAD;
  const Δλ = (to.lon - from.lon) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) / RAD) % 360 + 360) % 360;
}

export const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** The nearest of the 8 compass points to a bearing. */
export function compassPoint(bearing: number): CompassPoint {
  return COMPASS_POINTS[Math.round(bearing / 45) % 8];
}

/** Distances read naturally: 1 km steps below 20 km, 5 km below 100 km, then 10 km. */
export function roundKm(km: number): number {
  const step = km < 20 ? 1 : km < 100 ? 5 : 10;
  return Math.max(step === 1 ? 1 : step, Math.round(km / step) * step);
}
