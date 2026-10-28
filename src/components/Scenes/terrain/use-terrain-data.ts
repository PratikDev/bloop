"use client";

import { useEffect, useMemo, useState } from "react";
import { SRGBColorSpace, Texture } from "three";
import { DATA_PATHS, loadSstAnomaly, loadSstDt, type SstAnomalyField, type SstDtField, type SstField } from "@/lib/data";
import { loadImage } from "@/lib/load-image";
import { useLiveData } from "../../LiveData/use-live-data";
import { loadRelief, type Relief } from "../relief";
import type { LegendStop } from "../SceneShell/SceneLegend";
import { terrainField, type TerrainField } from "./field";
import { frameColourStops } from "./frame-colours";

export interface TerrainData {
  sst: SstField;
  field: TerrainField;
  relief: Relief;
  image: HTMLImageElement;
  stops: LegendStop[];
  /** §15, optional: the SVS 5176 anomaly (N: hear it against the normal tone) and MUR's hours since a look (clarity). */
  anomaly: SstAnomalyField | null;
  dt: SstDtField | null;
}

/** Today's SST (the app's own loaded frame), its NASA image, the bay relief, and (if published) the anomaly and dt grids. */
export function useTerrainData(): { data: TerrainData | null; error: boolean } {
  const { fields } = useLiveData();
  const [loaded, setLoaded] = useState<{ relief: Relief; image: HTMLImageElement; anomaly: SstAnomalyField | null; dt: SstDtField | null } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // The §15 grids are optional: a scene without them still plays the temperature itself.
    Promise.all([loadRelief("bay"), loadImage(DATA_PATHS.sstImage), loadSstAnomaly().catch(() => null), loadSstDt().catch(() => null)])
      .then(([relief, image, anomaly, dt]) => !cancelled && setLoaded({ relief, image, anomaly, dt }))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);
  const sst = fields?.sst ?? null;
  const data = useMemo(() => {
    if (!sst || !loaded) return null;
    const field = terrainField(sst);
    return field ? { sst, field, ...loaded, stops: frameColourStops(field, loaded.image) } : null;
  }, [sst, loaded]);
  return { data, error };
}

/** A fresh texture of the frame image for one scene build (the scene disposes it). */
export function sstTexture(image: HTMLImageElement): Texture {
  const tex = new Texture(image);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
