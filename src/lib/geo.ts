// Equirectangular map ↔ screen: x = (lon + 180) / 360 · width, y = (90 − lat) / 180 · height.

import type { LatLon } from "@/lib/data";

export function toXY(p: LatLon, width: number, height: number): { x: number; y: number } {
  return { x: ((p.lon + 180) / 360) * width, y: ((90 - p.lat) / 180) * height };
}

export function toLatLon(x: number, y: number, width: number, height: number): LatLon {
  return { lat: 90 - (y / height) * 180, lon: (x / width) * 360 - 180 };
}

/** Pixels per degree, horizontally and vertically. */
export function pxPerDeg(width: number, height: number): { x: number; y: number } {
  return { x: width / 360, y: height / 180 };
}
