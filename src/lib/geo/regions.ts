import type { LatLon } from "@/lib/data";
import { BD_DIVISIONS } from "./bd-divisions";
import type { GeoFiles } from "./gazetteer";

export interface RegionNode extends LatLon {
  id: string;
  name: string;
  nameBn: string | null;
  children: RegionNode[];
}

export const CONTINENTS = ["Asia", "Africa", "Europe", "North America", "South America", "Oceania", "Antarctica", "Seven seas (open ocean)"] as const;
export type Continent = (typeof CONTINENTS)[number];

const BANGLADESH = "BGD";

const mean = (points: LatLon[]): LatLon => ({
  lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
  lon: points.reduce((s, p) => s + p.lon, 0) / points.length,
});

function divisions(files: GeoFiles): RegionNode[] {
  const labels = new Map(
    files.districts.features.flatMap((f) => (f.properties.label ? [[f.properties.shapeName, { lat: f.properties.label[1], lon: f.properties.label[0] }] as const] : [])),
  );
  return BD_DIVISIONS.map((d) => {
    const points = d.districts.flatMap((name) => labels.get(name) ?? []);
    return { id: `division:${d.id}`, name: d.name, nameBn: d.nameBn, ...mean(points), children: [] };
  });
}

export function regionTree(files: GeoFiles): RegionNode[] {
  const byContinent = new Map<Continent, RegionNode[]>();
  for (const f of files.countries110m.features) {
    const p = f.properties;
    const continent = CONTINENTS.find((c) => c === p.CONTINENT);
    if (!continent || p.LABEL_X === undefined || p.LABEL_Y === undefined) continue;
    const id = p.ADM0_A3 ?? p.NAME;
    const country: RegionNode = {
      id: `country:${id}`,
      name: p.NAME_EN ?? p.NAME,
      nameBn: p.NAME_BN ?? null,
      lat: p.LABEL_Y,
      lon: p.LABEL_X,
      children: id === BANGLADESH ? divisions(files) : [],
    };
    byContinent.set(continent, [...(byContinent.get(continent) ?? []), country]);
  }
  return CONTINENTS.flatMap((c) => {
    const countries = (byContinent.get(c) ?? []).sort((a, b) => a.name.localeCompare(b.name, "en"));
    return countries.length === 0 ? [] : [{ id: `continent:${c}`, name: c, nameBn: null, ...mean(countries), children: countries }];
  });
}
