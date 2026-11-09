// public/geo/, loaded once: the Turntable and Listen's place names share the same files and the same gazetteer.

import { fetchJson } from "@/lib/data";
import { createGazetteer, type Gazetteer, type GeoFiles } from "./gazetteer";
import type { FeatureCollection, LineGeometry, RiverProps } from "./types";

const GEO = "/geo";

let files: Promise<GeoFiles> | null = null;
let gazetteer: Promise<Gazetteer> | null = null;

export function loadGeoFiles(): Promise<GeoFiles> {
  files ??= Promise.all([
    fetchJson<GeoFiles["countries110m"]>(`${GEO}/countries-110m.json`),
    fetchJson<GeoFiles["countriesSouthAsia"]>(`${GEO}/countries-10m-south-asia.json`),
    fetchJson<GeoFiles["districts"]>(`${GEO}/bd-districts.json`),
    fetchJson<GeoFiles["marine"]>(`${GEO}/marine.json`),
    fetchJson<GeoFiles["places"]>(`${GEO}/places.json`),
    fetchJson<GeoFiles["story"]>(`${GEO}/story-places.json`),
  ]).then(([countries110m, countriesSouthAsia, districts, marine, places, story]) => ({ countries110m, countriesSouthAsia, districts, marine, places, story }));
  return files;
}

export function loadGazetteer(): Promise<Gazetteer> {
  gazetteer ??= loadGeoFiles().then(createGazetteer);
  return gazetteer;
}

export const loadRivers = () => fetchJson<FeatureCollection<RiverProps, LineGeometry>>(`${GEO}/rivers.json`);
