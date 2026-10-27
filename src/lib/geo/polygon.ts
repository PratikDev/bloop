// Point-in-polygon on lon/lat (even-odd ray casting, holes respected), with a
// bounding box first. Planar in degrees: fine for "which country / district /
// sea is this", which is all it's used for.

import type { AreaGeometry, Feature, Position } from "./types";

export interface IndexedArea<P> {
  properties: P;
  bbox: [number, number, number, number]; // west, south, east, north
  polygons: Position[][][];
}

function inRing(lon: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and outside every hole of one polygon. */
function inPolygon(lon: number, lat: number, rings: Position[][]): boolean {
  if (!inRing(lon, lat, rings[0])) return false;
  for (let h = 1; h < rings.length; h++) if (inRing(lon, lat, rings[h])) return false;
  return true;
}

export function indexAreas<P>(features: Feature<P, AreaGeometry>[]): IndexedArea<P>[] {
  const out: IndexedArea<P>[] = [];
  for (const f of features) {
    if (!f.geometry) continue;
    const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const bbox: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of polygons)
      for (const [x, y] of poly[0]) {
        bbox[0] = Math.min(bbox[0], x);
        bbox[1] = Math.min(bbox[1], y);
        bbox[2] = Math.max(bbox[2], x);
        bbox[3] = Math.max(bbox[3], y);
      }
    out.push({ properties: f.properties, bbox, polygons });
  }
  return out;
}

/** The first area containing (lat, lon), or null. */
export function areaAt<P>(areas: IndexedArea<P>[], lat: number, lon: number): IndexedArea<P> | null {
  for (const a of areas) {
    const [w, s, e, n] = a.bbox;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    if (a.polygons.some((rings) => inPolygon(lon, lat, rings))) return a;
  }
  return null;
}
