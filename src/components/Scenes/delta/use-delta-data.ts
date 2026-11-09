"use client";

import { useEffect, useMemo, useState } from "react";
import { voiceSpec } from "@/lib/audio/mapping";
import { loadEnsemble, loadGrace } from "@/lib/data";
import type { EnsembleFile, GraceBoxName, GraceContextFile } from "@/types/data-contract";
import type { Geo } from "../../Turntable/use-geo";
import type { Bounds } from "../plane";
import { loadRelief, type Relief } from "../relief";
import type { DeltaSceneData } from "./delta-scene";

/** The rivers drawn (Natural Earth names); the Meghna isn't in the shipped file. */
export const DELTA_RIVERS = ["Ganges", "Brahmaputra"] as const;
export type DeltaRiverName = (typeof DELTA_RIVERS)[number];

export interface DeltaData {
  grace: GraceContextFile;
  ensemble: EnsembleFile;
  scene: DeltaSceneData;
}

/** The water voice's own input range (mapping.json "water"): one fixed scale for both boxes. */
export function waterRange(): { min: number; max: number } | null {
  const m = voiceSpec("water").mapping;
  return m?.kind === "continuous" ? { min: m.input.min, max: m.input.max } : null;
}

const boxBounds = (grace: GraceContextFile, name: GraceBoxName): Bounds => grace.boxes[name].box_lon_lat;

export function useDeltaData(geo: Geo | null): { data: DeltaData | null; error: boolean } {
  const [loaded, setLoaded] = useState<{ grace: GraceContextFile; ensemble: EnsembleFile; relief: Relief } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGrace(), loadEnsemble(), loadRelief("bd")])
      .then(([grace, ensemble, relief]) => !cancelled && setLoaded({ grace, ensemble, relief }))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo((): DeltaData | null => {
    const range = waterRange();
    if (!loaded || !geo || !range) return null;
    const rivers = DELTA_RIVERS.map((name) => ({
      name,
      paths: geo.overlays.rivers
        .filter((f) => f.properties.name === name)
        .flatMap((f) => (f.geometry?.type === "LineString" ? [f.geometry.coordinates] : (f.geometry?.coordinates ?? []))),
    }));
    return {
      grace: loaded.grace,
      ensemble: loaded.ensemble,
      scene: {
        relief: loaded.relief,
        boxes: (["Bangladesh", "NW_India"] as const).map((name) => ({ name, bounds: boxBounds(loaded.grace, name) })),
        rivers,
        districts: geo.overlays.districts,
        range,
      },
    };
  }, [loaded, geo]);

  return {
    data,
    error: error || waterRange() === null,
  };
}
