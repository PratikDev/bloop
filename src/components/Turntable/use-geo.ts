"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/data";
import { createGazetteer, type Gazetteer, type GeoFiles } from "@/lib/geo/gazetteer";
import type { FeatureCollection, LineGeometry, RiverProps } from "@/lib/geo/types";
import type { OverlayData } from "./scene/overlays";

const GEO = "/geo";

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
    Promise.all([
      fetchJson<GeoFiles["countries110m"]>(`${GEO}/countries-110m.json`),
      fetchJson<GeoFiles["countriesSouthAsia"]>(`${GEO}/countries-10m-south-asia.json`),
      fetchJson<GeoFiles["districts"]>(`${GEO}/bd-districts.json`),
      fetchJson<GeoFiles["marine"]>(`${GEO}/marine.json`),
      fetchJson<GeoFiles["places"]>(`${GEO}/places.json`),
      fetchJson<GeoFiles["story"]>(`${GEO}/story-places.json`),
      fetchJson<FeatureCollection<RiverProps, LineGeometry>>(`${GEO}/rivers.json`),
    ])
      .then(([countries110m, countriesSouthAsia, districts, marine, places, story, rivers]) => {
        if (cancelled) return;
        const files: GeoFiles = { countries110m, countriesSouthAsia, districts, marine, places, story };
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
