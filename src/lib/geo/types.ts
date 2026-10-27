// The small part of GeoJSON the Turntable overlays use ([lon, lat] positions),
// and the shapes of the files scripts/build-geo.mjs writes to public/geo/.

export type Position = [number, number];

export type AreaGeometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };

export type LineGeometry =
  | { type: "LineString"; coordinates: Position[] }
  | { type: "MultiLineString"; coordinates: Position[][] };

export interface Feature<P, G> {
  type: "Feature";
  properties: P;
  geometry: G | null;
}

export interface FeatureCollection<P, G> {
  type: "FeatureCollection";
  features: Feature<P, G>[];
}

export interface CountryProps {
  NAME: string;
  NAME_EN?: string;
  NAME_BN?: string | null;
  LABEL_X?: number;
  LABEL_Y?: number;
  LABELRANK?: number;
  ADM0_A3?: string;
}

export interface DistrictProps {
  shapeName: string;
  label?: Position;
}

export interface MarineProps {
  name: string | null;
  name_bn?: string | null;
  featurecla?: string;
  scalerank?: number;
  label?: Position;
}

export interface RiverProps {
  name: string | null;
  name_bn?: string | null;
  scalerank?: number;
  highlight?: boolean;
}

/** places.json: compact rows, field order in `fields`. */
export interface PlacesFile {
  fields: ["name", "name_bn", "lat", "lon", "pop_max", "scalerank", "country", "capital"];
  rows: [string, string | null, number, number, number, number, string, boolean][];
}

export interface StoryPlace {
  id: string;
  name: string;
  name_bn: string | null;
  lat: number;
  lon: number;
  zoom: "region" | "local";
  source: string;
}

export interface StoryPlacesFile {
  bookmarks: StoryPlace[];
  tour: string[];
  alwaysLabel: string[];
  extraCities: { name: string; name_bn: string | null; lat: number; lon: number; country: string; source: string }[];
}

/** One named place the app can label, search and measure distances from. */
export interface Place {
  name: string;
  nameBn: string | null;
  lat: number;
  lon: number;
  pop: number;
  rank: number; // Natural Earth scalerank (lower = more important); curated places use 0
  country: string;
  capital: boolean;
  alwaysLabel: boolean;
}
