"use client";

import { useEffect, useState } from "react";
import type { Gazetteer, GeoFiles } from "@/lib/geo/gazetteer";
import { loadGeo } from "@/lib/geo/load";
import type { OverlayData } from "./scene/overlays";

export interface Geo {
  gazetteer: Gazetteer;
  overlays: OverlayData;
  files: GeoFiles;
}

/** Loads public/geo/ when the Turntable opens (never before; shared with the Listen map: src/lib/geo/load.ts). */
export function useGeo(): Geo | null {
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadGeo()
      .then(({ files, rivers, gazetteer }) => {
        if (cancelled) return;
        setGeo({
          files,
          gazetteer,
          overlays: {
            countriesWorld: files.countries110m.features,
            countriesDetail: files.countriesSouthAsia.features,
            districts: files.districts.features,
            rivers: rivers.features,
          },
        });
      })
      .catch(() => undefined); // the globe still works without overlays; the search box says so
    return () => {
      cancelled = true;
    };
  }, []);
  return geo;
}
