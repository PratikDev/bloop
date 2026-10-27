// Geometry on the globe, all placed with latLonToSphere so every layer (earth,
// data frame, borders, labels, needle) shares one lat/lon convention.

import { BufferGeometry, Float32BufferAttribute } from "three";
import type { Position } from "@/lib/geo/types";
import { latLonToSphere } from "@/lib/sphere";

/** A UV sphere: u = (lon + 180) / 360, v = (lat + 90) / 180 (equirectangular, row 0 = 90° N). */
export function globeGeometry(radius: number, cols = 192, rows = 96): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const lat = 90 - (i / rows) * 180;
    for (let j = 0; j <= cols; j++) {
      const lon = -180 + (j / cols) * 360;
      const p = latLonToSphere(lat, lon, radius);
      positions.push(p.x, p.y, p.z);
      uvs.push(j / cols, 1 - i / rows);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j;
      const b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  return geometry;
}

/** Longest segment before it is split, so lines follow the curve instead of cutting through the globe. */
const MAX_STEP_DEG = 2;

/** GeoJSON lines ([lon, lat] paths) as segment pairs for LineSegments, lifted to `radius`. */
export function pathsGeometry(paths: Position[][], radius: number): BufferGeometry {
  const positions: number[] = [];
  const push = (lat: number, lon: number) => {
    const p = latLonToSphere(lat, lon, radius);
    positions.push(p.x, p.y, p.z);
  };
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [lon0, lat0] = path[i - 1];
      const [lon1, lat1] = path[i];
      if (Math.abs(lon1 - lon0) > 180) continue; // crosses the antimeridian: skip that one segment
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(lon1 - lon0), Math.abs(lat1 - lat0)) / MAX_STEP_DEG));
      for (let s = 0; s < steps; s++) {
        const a = s / steps;
        const b = (s + 1) / steps;
        push(lat0 + (lat1 - lat0) * a, lon0 + (lon1 - lon0) * a);
        push(lat0 + (lat1 - lat0) * b, lon0 + (lon1 - lon0) * b);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
}

/** A full circle of latitude as a [lon, lat] path. */
export function parallel(lat: number, stepDeg = 2): Position[] {
  const path: Position[] = [];
  for (let lon = -180; lon <= 180; lon += stepDeg) path.push([lon, lat]);
  return path;
}

/** A meridian from pole to pole as a [lon, lat] path. */
export function meridian(lon: number, stepDeg = 2): Position[] {
  const path: Position[] = [];
  for (let lat = -90; lat <= 90; lat += stepDeg) path.push([lon, lat]);
  return path;
}
