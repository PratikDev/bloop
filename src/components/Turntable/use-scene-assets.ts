"use client";

import { useEffect, type RefObject } from "react";
import { Vector3 } from "three";
import type { SstField } from "@/lib/data";
import { subsolarPoint } from "@/lib/geo/sun";
import { latLonToSphere } from "@/lib/sphere";
import { oceanMask } from "./data-layer";
import type { TurntableScene } from "./scene";
import { defaultQuality, loadEarthTextures, type TextureQuality } from "./textures";
import type { Geo } from "./use-geo";

export interface SceneSettings {
  /** null = automatic (by device). */
  quality: TextureQuality | null;
  /** The frame time the sun is placed at; null = always day. */
  sunTime: string | null;
  dataOpacity: number;
  sst: SstField | null;
  geo: Geo | null;
}

/**
 * Feeds the scene what loads later or changes rarely. Must be called after the
 * effect that creates the scene, so these effects run after it.
 */
export function useSceneAssets(sceneRef: RefObject<TurntableScene | null>, s: SceneSettings): void {
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let cancelled = false;
    const wanted = s.quality ?? defaultQuality(scene.maxTextureSize);
    const quality = (wanted > scene.maxTextureSize ? 4096 : wanted) as TextureQuality;
    loadEarthTextures(quality)
      .then((t) => {
        if (cancelled || sceneRef.current !== scene) {
          for (const tex of [t.day, t.night, t.relief]) tex.dispose();
          return;
        }
        scene.earth.setTextures(t);
        scene.earth.setRelief(t.reliefOn);
      })
      .catch(() => undefined); // the globe keeps its plain fallback colour; the data frame still shows
    return () => {
      cancelled = true;
    };
  }, [sceneRef, s.quality]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !s.sst) return;
    const { width, height } = s.sst.meta.grid;
    scene.earth.setOceanMask(oceanMask(s.sst), width, height);
  }, [sceneRef, s.sst]);

  useEffect(() => {
    if (s.geo) sceneRef.current?.overlays.setData(s.geo.overlays);
  }, [sceneRef, s.geo]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!s.sunTime) {
      scene.earth.setSun(null);
      return;
    }
    const sun = subsolarPoint(new Date(s.sunTime));
    const d = latLonToSphere(sun.lat, sun.lon);
    scene.earth.setSun(new Vector3(d.x, d.y, d.z));
  }, [sceneRef, s.sunTime]);

  useEffect(() => {
    sceneRef.current?.earth.setDataOpacity(s.dataOpacity);
  }, [sceneRef, s.dataOpacity]);
}
