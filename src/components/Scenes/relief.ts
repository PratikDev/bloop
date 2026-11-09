// The scenes' basemap: Blue Marble colour and GEBCO relief crops built by
// scripts/build-scene-textures.mjs (decoration only, never data).

import {
  BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from "three";
import { fetchBuffer, fetchJson } from "@/lib/data";
import { geoPlane, METRES_PER_DEGREE, type Bounds, type GeoPlane } from "./plane";

const BASE = "/textures/scenes/";

export type ReliefName = "bd" | "bay";

interface ReliefSources {
  regions: Record<ReliefName, { bounds: Bounds; colour: string; height: string; height_size: [number, number] }>;
}

export interface Relief {
  plane: GeoPlane;
  colour: Texture;
  /** Metres, row 0 = north. */
  metres: Int16Array;
  width: number;
  height: number;
  /** Bilinear height in metres at a point (0 outside). */
  metresAt(lat: number, lon: number): number;
}

export async function loadRelief(name: ReliefName): Promise<Relief> {
  const sources = await fetchJson<ReliefSources>(`${BASE}SOURCES.json`);
  const r = sources.regions[name];
  const [colour, buffer] = await Promise.all([new TextureLoader().loadAsync(BASE + r.colour), fetchBuffer(BASE + r.height)]);
  colour.colorSpace = SRGBColorSpace;
  const [width, height] = r.height_size;
  const metres = new Int16Array(buffer);
  const plane = geoPlane(r.bounds);
  const [w, s, e, n] = r.bounds;
  const metresAt = (lat: number, lon: number) => {
    if (!plane.contains(lat, lon)) return 0;
    const fx = ((lon - w) / (e - w)) * (width - 1);
    const fy = ((n - lat) / (n - s)) * (height - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const at = (x: number, y: number) => metres[y * width + x];
    return (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) + (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty;
  };
  return { plane, colour, metres, width, height, metresAt };
}

/** Scene units of height for metres, at a vertical exaggeration. */
export const heightOf = (metres: number, exaggeration: number) => (metres / METRES_PER_DEGREE) * exaggeration;

/**
 * The relief as a lit mesh: Blue Marble colour on GEBCO heights. `floor` clamps
 * the sea floor (metres) so the coast reads; the sea itself is the scene's own.
 */
export function reliefMesh(relief: Relief, exaggeration: number, floor: number): Mesh {
  const { plane, width, height, metres } = relief;
  const geometry = new PlaneGeometry(plane.size.x, plane.size.z, width - 1, height - 1);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.getAttribute("position") as BufferAttribute;
  // PlaneGeometry rows run north to south after the rotation, like the raster.
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightOf(Math.max(floor, metres[i]), exaggeration));
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  const material = new MeshStandardMaterial({ map: relief.colour, roughness: 0.92, metalness: 0 });
  return new Mesh(geometry, material);
}
