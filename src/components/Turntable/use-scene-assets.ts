"use client";

import { useEffect } from "react";
import { Vector3 } from "three";
import { subsolarPoint } from "@/lib/geo/sun";
import { latLonToSphere } from "@/lib/sphere";
import type { TurntableScene } from "./scene";
import type { Geo } from "./use-geo";

export interface SceneSettings {
  /** The frame time the sun is placed at; null = always day. */
  sunTime: string | null;
  dataOpacity: number;
  geo: Geo | null;
}

/** Feeds the scene what loads later or changes rarely, once R3F has created it. */
export function useSceneAssets(scene: TurntableScene | null, s: SceneSettings): void {
  useEffect(() => {
    if (scene && s.geo) scene.overlays.setData(s.geo.overlays);
  }, [scene, s.geo]);

  useEffect(() => {
    if (!scene) return;
    if (!s.sunTime) {
      scene.setSun(null);
      return;
    }
    const sun = subsolarPoint(new Date(s.sunTime));
    const d = latLonToSphere(sun.lat, sun.lon);
    scene.setSun(new Vector3(d.x, d.y, d.z));
  }, [scene, s.sunTime]);

  useEffect(() => {
    scene?.earth.setDataOpacity(s.dataOpacity);
  }, [scene, s.dataOpacity]);
}
