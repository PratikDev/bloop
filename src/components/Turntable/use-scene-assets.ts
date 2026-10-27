"use client";

import { useEffect } from "react";
import { Vector3 } from "three";
import type { SstField } from "@/lib/data";
import { subsolarPoint } from "@/lib/geo/sun";
import { latLonToSphere } from "@/lib/sphere";
import { oceanMask } from "./data-layer";
import { resolveTier, type Tier } from "./quality";
import type { TurntableScene } from "./scene";
import { builtMonths, frameMonth, surfaceMonth } from "./textures";
import type { Geo } from "./use-geo";

export interface SceneSettings {
  /** null = automatic (by device). */
  quality: Tier | null;
  /** The record's frame time: picks the Blue Marble month. */
  frameTime: string | null;
  /** The frame time the sun is placed at; null = always day. */
  sunTime: string | null;
  dataOpacity: number;
  sst: SstField | null;
  geo: Geo | null;
}

/** Feeds the scene what loads later or changes rarely, once R3F has created it. */
export function useSceneAssets(scene: TurntableScene | null, s: SceneSettings): void {
  // The surface textures follow the tier and the frame's month (not the exact time,
  // so switching between two September records doesn't reload them).
  const month = s.frameTime ? frameMonth(s.frameTime) : null;
  useEffect(() => {
    if (!scene || !month) return;
    let cancelled = false;
    const tier = resolveTier(s.quality, scene.maxTextureSize);
    // Progressive: the small Low set first (the globe and the intro appear quickly), then the tier's own maps.
    const steps: Tier[] = tier === "low" ? ["low"] : ["low", tier];
    const load = async () => {
      const m = surfaceMonth(month, await builtMonths());
      for (const step of steps) {
        const t = await scene.textures.load(step, m);
        if (cancelled) {
          for (const tex of [t.day, t.night, t.normal, t.clouds]) tex?.dispose();
          return;
        }
        scene.earth.setTextures(t);
      }
    };
    load().catch(() => undefined); // the globe keeps its plain fallback colour; the data frame still shows
    return () => {
      cancelled = true;
    };
  }, [scene, s.quality, month]);

  useEffect(() => {
    if (!scene || !s.sst) return;
    const { width, height } = s.sst.meta.grid;
    scene.earth.setOceanMask(oceanMask(s.sst), width, height);
  }, [scene, s.sst]);

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
