// The FrameInfo a flat (regional) scene publishes each frame, so the
// Turntable's label layer and needle chip work unchanged: positions come from
// the regional plane, "distance" is the camera's distance scaled to the
// globe's label tiers, and anchors place a scene's own HTML labels.

import { Vector3, type PerspectiveCamera } from "three";
import type { LatLon } from "@/lib/data";
import type { FrameInfo } from "../Turntable/use-turntable";
import type { GeoPlane } from "./plane";

export interface SceneFrame extends FrameInfo {
  /** Screen position of a named 3D point (null = behind the camera or unknown). */
  anchor(key: string): { x: number; y: number } | null;
}

const p = new Vector3();

/** Camera distance (scene units) → the globe label tiers' distance (labels.ts): far = countries, near = districts. */
const LABEL_DISTANCE_PER_UNIT = 0.22;
const LABEL_DISTANCE = { min: 1.15, max: 3.6 };

export function planeFrame(o: {
  camera: PerspectiveCamera;
  width: number;
  height: number;
  plane: GeoPlane;
  groundAt(lat: number, lon: number): number;
  needle: LatLon;
  /** The camera's distance to what it looks at (scene units). */
  distance: number;
  anchors?: ReadonlyMap<string, Vector3>;
}): SceneFrame {
  const { camera, width, height, plane } = o;
  const toScreen = (v: Vector3) => {
    p.copy(v).project(camera);
    return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height, facing: p.z < 1 && p.z > -1 ? 1 : -1 };
  };
  const project = (lat: number, lon: number) => {
    const { x, z } = plane.toXZ(lat, lon);
    return toScreen(new Vector3(x, o.groundAt(lat, lon) + 0.02, z));
  };
  return {
    width,
    height,
    needle: project(o.needle.lat, o.needle.lon),
    blend: 1,
    distance: Math.min(LABEL_DISTANCE.max, Math.max(LABEL_DISTANCE.min, o.distance * LABEL_DISTANCE_PER_UNIT)),
    viewLat: plane.centre.lat,
    viewLon: plane.centre.lon,
    project,
    anchor(key) {
      const v = o.anchors?.get(key);
      if (!v) return null;
      const s = toScreen(v);
      return s.facing > 0 ? s : null;
    },
  };
}
