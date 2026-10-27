// Everything the Turntable knows about places, built from public/geo/: which
// sea, country and Bangladesh district a point is in, the nearest labelled
// city (distance and compass direction), and the search entries.

import type { LatLon } from "@/lib/data/places";
import { areaAt, indexAreas, type IndexedArea } from "./polygon";
import { createSearchIndex, type SearchEntry, type SearchIndex } from "./search";
import { bearingDeg, compassPoint, distanceKm, type CompassPoint } from "./spherical";
import type {
  AreaGeometry,
  CountryProps,
  DistrictProps,
  FeatureCollection,
  MarineProps,
  Place,
  PlacesFile,
  StoryPlace,
  StoryPlacesFile,
} from "./types";

export interface GeoFiles {
  countries110m: FeatureCollection<CountryProps, AreaGeometry>;
  countriesSouthAsia: FeatureCollection<CountryProps, AreaGeometry>;
  districts: FeatureCollection<DistrictProps, AreaGeometry>;
  marine: FeatureCollection<MarineProps, AreaGeometry>;
  places: PlacesFile;
  story: StoryPlacesFile;
}

export interface Named {
  name: string;
  nameBn: string | null;
}

export interface WhereAmI {
  sea: Named | null;
  country: Named | null;
  district: string | null; // Bangladesh only (geoBoundaries names, English)
  /** Set when the point is in or right next to a labelled city. */
  atCity: Place | null;
  /** The nearest labelled city otherwise (within NEAREST_MAX_KM). */
  nearest: { place: Place; km: number; direction: CompassPoint } | null;
}

export interface Gazetteer {
  places: Place[];
  bookmarks: StoryPlace[];
  tour: StoryPlace[];
  whereAmI(at: LatLon): WhereAmI;
  search: SearchIndex["search"];
}

const NEAREST_MAX_KM = 2000;
/** Big cities count as "here" further out (design choice). */
const cityRadiusKm = (p: Place) => (p.pop >= 1_000_000 ? 20 : 8);
/** Cities used for "N km DIR of …": always-labelled ones and Natural Earth's most important. */
const isReference = (p: Place) => p.alwaysLabel || p.rank <= 4;

const named = (name: string | null | undefined, nameBn: string | null | undefined): Named | null =>
  name ? { name, nameBn: nameBn ?? null } : null;

function buildPlaces(files: GeoFiles): Place[] {
  const always = new Set(files.story.alwaysLabel);
  // Country names in Bangla, from Natural Earth's own country table.
  const countryBn = new Map<string, string>();
  for (const f of [...files.countries110m.features, ...files.countriesSouthAsia.features]) {
    if (f.properties.NAME_BN) countryBn.set(f.properties.NAME, f.properties.NAME_BN);
  }
  const fromNe: Place[] = files.places.rows.map(([name, nameBn, lat, lon, pop, rank, country, capital]) => ({
    name,
    nameBn,
    lat,
    lon,
    pop,
    rank,
    country,
    countryBn: countryBn.get(country) ?? null,
    capital,
    alwaysLabel: always.has(name) && country === "Bangladesh",
  }));
  const extra: Place[] = files.story.extraCities.map((c) => ({
    name: c.name,
    nameBn: c.name_bn,
    lat: c.lat,
    lon: c.lon,
    pop: 0,
    rank: 0,
    country: c.country,
    countryBn: countryBn.get(c.country) ?? null,
    capital: false,
    alwaysLabel: always.has(c.name),
  }));
  return [...fromNe, ...extra];
}

function buildSearchEntries(files: GeoFiles, places: Place[]): SearchEntry[] {
  const entries: SearchEntry[] = files.story.bookmarks.map((b) => ({
    kind: "story",
    name: b.name,
    nameBn: b.name_bn,
    lat: b.lat,
    lon: b.lon,
    zoom: b.zoom,
    weight: 100,
  }));
  for (const f of files.countries110m.features) {
    const p = f.properties;
    if (p.LABEL_X === undefined || p.LABEL_Y === undefined) continue;
    entries.push({ kind: "country", name: p.NAME, nameBn: p.NAME_BN ?? null, lat: p.LABEL_Y, lon: p.LABEL_X, zoom: "country", weight: 80 });
  }
  for (const p of places) {
    const weight = (p.country === "Bangladesh" ? 60 : 40) + Math.log10(Math.max(p.pop, 1));
    entries.push({ kind: "city", name: p.name, nameBn: p.nameBn, lat: p.lat, lon: p.lon, zoom: "local", weight, detail: p.country });
  }
  for (const f of files.districts.features) {
    const [lon, lat] = f.properties.label ?? [NaN, NaN];
    if (Number.isFinite(lat)) entries.push({ kind: "district", name: `${f.properties.shapeName} District`, nameBn: null, lat, lon, zoom: "local", weight: 30 });
  }
  for (const f of files.marine.features) {
    const p = f.properties;
    if (!p.name || !p.label) continue;
    entries.push({ kind: "sea", name: p.name, nameBn: p.name_bn ?? null, lat: p.label[1], lon: p.label[0], zoom: "region", weight: 50 });
  }
  return entries;
}

export function createGazetteer(files: GeoFiles): Gazetteer {
  const places = buildPlaces(files);
  const references = places.filter(isReference);
  const countriesWorld: IndexedArea<CountryProps>[] = indexAreas(files.countries110m.features);
  const countriesDetail: IndexedArea<CountryProps>[] = indexAreas(files.countriesSouthAsia.features);
  const districts = indexAreas(files.districts.features);
  const seas = indexAreas(files.marine.features);
  const index = createSearchIndex(buildSearchEntries(files, places));
  const byId = new Map(files.story.bookmarks.map((b) => [b.id, b]));

  return {
    places,
    bookmarks: files.story.bookmarks,
    tour: files.story.tour.map((id) => byId.get(id)).filter((b): b is StoryPlace => b !== undefined),
    search: index.search,
    whereAmI(at) {
      const countryArea = areaAt(countriesDetail, at.lat, at.lon) ?? areaAt(countriesWorld, at.lat, at.lon);
      const country = countryArea && named(countryArea.properties.NAME, countryArea.properties.NAME_BN);
      const district = country?.name === "Bangladesh" ? (areaAt(districts, at.lat, at.lon)?.properties.shapeName ?? null) : null;
      const seaArea = areaAt(seas, at.lat, at.lon);
      const sea = seaArea && named(seaArea.properties.name, seaArea.properties.name_bn);

      let atCity: Place | null = null;
      for (const p of places) {
        const km = distanceKm(at, p);
        if (km <= cityRadiusKm(p) && (!atCity || p.pop > atCity.pop)) atCity = p;
      }
      let nearest: WhereAmI["nearest"] = null;
      if (!atCity) {
        for (const p of references) {
          const km = distanceKm(p, at);
          if (km <= NEAREST_MAX_KM && (!nearest || km < nearest.km)) nearest = { place: p, km, direction: compassPoint(bearingDeg(p, at)) };
        }
      }
      return { sea, country, district, atCity, nearest };
    },
  };
}
