"use client";

import { useEffect, useState } from "react";
import { createGazetteer, type Gazetteer, type GeoFiles } from "@/lib/geo/gazetteer";
import { loadGeoFiles, loadRivers } from "@/lib/geo/load-files";
import type { OverlayData } from "./scene/overlays";

export interface Geo {
  gazetteer: Gazetteer;
  overlays: OverlayData;
  files: GeoFiles;
}

/** Loads public/geo/ when the Turntable opens (never before), and builds the gazetteer. */
export function useGeo(): Geo | null {
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGeoFiles(), loadRivers()])
      .then(([files, rivers]) => {
        if (cancelled) return;
        const { countries110m, countriesSouthAsia, districts } = files;
        setGeo({
          files,
          gazetteer: createGazetteer(files),
          overlays: {
            countriesWorld: countries110m.features,
            countriesDetail: countriesSouthAsia.features,
            districts: districts.features,
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
