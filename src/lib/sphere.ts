// Latitude/longitude ↔ a point on the globe, in three.js axes: y up (north),
// lon 0° toward +z, east toward +x. The globe mesh, the needle and picking all
// use these two functions, so what is drawn and what is read can't drift apart.

import { clampLat, wrapLon } from "@/lib/data/grid";
import type { LatLon } from "@/lib/data/places";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const RAD = Math.PI / 180;

export function latLonToSphere(lat: number, lon: number, radius = 1): Vec3 {
  const phi = lat * RAD;
  const lambda = lon * RAD;
  const ring = radius * Math.cos(phi);
  return { x: ring * Math.sin(lambda), y: radius * Math.sin(phi), z: ring * Math.cos(lambda) };
}

/**
 * The lat/lon of a point on (or off) the globe, from its direction only.
 * Longitude follows the grid convention, [−180, 180): 180° E reads as 180° W.
 */
export function sphereHitToLatLon(p: Vec3): LatLon {
  const lat = Math.atan2(p.y, Math.hypot(p.x, p.z)) / RAD;
  return { lat: clampLat(lat), lon: wrapLon(Math.atan2(p.x, p.z) / RAD) };
}
