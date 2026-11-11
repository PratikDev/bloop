import { fetchJson } from "@/lib/data";
import { createGazetteer, type Gazetteer, type GeoFiles } from "./gazetteer";
import type { FeatureCollection, LineGeometry, RiverProps } from "./types";

const GEO = "/geo";

export interface GeoData {
  files: GeoFiles;
  rivers: FeatureCollection<RiverProps, LineGeometry>;
  gazetteer: Gazetteer;
}

let loading: Promise<GeoData> | null = null;

export function loadGeo(): Promise<GeoData> {
  loading ??= Promise.all([
    fetchJson<GeoFiles["countries110m"]>(`${GEO}/countries-110m.json`),
    fetchJson<GeoFiles["countriesSouthAsia"]>(`${GEO}/countries-10m-south-asia.json`),
    fetchJson<GeoFiles["districts"]>(`${GEO}/bd-districts.json`),
    fetchJson<GeoFiles["marine"]>(`${GEO}/marine.json`),
    fetchJson<GeoFiles["places"]>(`${GEO}/places.json`),
    fetchJson<GeoFiles["story"]>(`${GEO}/story-places.json`),
    fetchJson<FeatureCollection<RiverProps, LineGeometry>>(`${GEO}/rivers.json`),
  ]).then(
    ([countries110m, countriesSouthAsia, districts, marine, places, story, rivers]) => {
      const files: GeoFiles = { countries110m, countriesSouthAsia, districts, marine, places, story };
      return { files, rivers, gazetteer: createGazetteer(files) };
    },
    (error: unknown) => {
      loading = null;
      throw error;
    },
  );
  return loading;
}
