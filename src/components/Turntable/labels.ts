// Which names the globe can show, in priority order, and how close the camera
// must be for each (camera distance in globe radii). Collision avoidance in
// LabelLayer keeps the first-placed (most important) labels.

import type { Lang } from "@/lib/i18n";
import type { Gazetteer, GeoFiles } from "@/lib/geo/gazetteer";
import { localName } from "./place-text";

export type LabelKind = "country" | "sea" | "city" | "capital" | "story" | "district";

export interface LabelCandidate {
  key: string;
  text: string;
  lang: Lang;
  lat: number;
  lon: number;
  kind: LabelKind;
  /** Shown only when the camera is at most this far (globe radii). */
  maxDistance: number;
}

/** Distance tiers (design choices): the Jukebox view counts as far away. */
export const JUKEBOX_DISTANCE = 4.6;
const ALWAYS = 6;

const placeTier = (rank: number) => (rank <= 2 ? 3.2 : rank <= 4 ? 2.3 : rank <= 6 ? 1.75 : 1.4);
const countryTier = (rank: number) => (rank <= 2 ? ALWAYS : rank <= 4 ? 3.4 : 2.4);
const seaTier = (rank: number) => (rank <= 1 ? ALWAYS : rank <= 3 ? 3.0 : 2.0);

export function labelCandidates(files: GeoFiles, gaz: Gazetteer, lang: Lang): LabelCandidate[] {
  const out: LabelCandidate[] = [];
  const named = (n: { name: string; nameBn: string | null }) => localName(n, lang);

  for (const b of gaz.bookmarks) {
    const { text, lang: l } = named({ name: b.name, nameBn: b.name_bn });
    out.push({ key: `story:${b.id}`, text, lang: l, lat: b.lat, lon: b.lon, kind: "story", maxDistance: 3.6 });
  }
  const storyNames = new Set(gaz.bookmarks.map((b) => b.name));
  const places = [...gaz.places].sort((a, b) => Number(b.alwaysLabel) - Number(a.alwaysLabel) || a.rank - b.rank || b.pop - a.pop);
  for (const p of places) {
    if (storyNames.has(p.name)) continue;
    const { text, lang: l } = named(p);
    const maxDistance = p.alwaysLabel ? 3.6 : placeTier(p.rank);
    out.push({ key: `city:${p.name}:${p.lat}`, text, lang: l, lat: p.lat, lon: p.lon, kind: p.capital ? "capital" : "city", maxDistance });
  }
  for (const f of files.countries110m.features) {
    const p = f.properties;
    if (p.LABEL_X === undefined || p.LABEL_Y === undefined) continue;
    const { text, lang: l } = named({ name: p.NAME, nameBn: p.NAME_BN ?? null });
    out.push({ key: `country:${p.NAME}`, text, lang: l, lat: p.LABEL_Y, lon: p.LABEL_X, kind: "country", maxDistance: countryTier(p.LABELRANK ?? 5) });
  }
  for (const f of files.marine.features) {
    const p = f.properties;
    if (!p.name || !p.label) continue;
    const { text, lang: l } = named({ name: p.name, nameBn: p.name_bn ?? null });
    out.push({ key: `sea:${p.name}`, text, lang: l, lat: p.label[1], lon: p.label[0], kind: "sea", maxDistance: seaTier(p.scalerank ?? 5) });
  }
  for (const f of files.districts.features) {
    const label = f.properties.label;
    if (!label) continue;
    out.push({ key: `district:${f.properties.shapeName}`, text: f.properties.shapeName, lang: "en", lat: label[1], lon: label[0], kind: "district", maxDistance: 1.6 });
  }

  // Priority: story places and Bangladesh's always-on cities, then countries and seas, then other places, then districts.
  const order: Record<LabelKind, number> = { story: 0, capital: 2, city: 3, country: 1, sea: 1, district: 4 };
  const always = new Set(gaz.places.filter((p) => p.alwaysLabel).map((p) => `city:${p.name}:${p.lat}`));
  return out
    .map((c, i) => ({ c, i, pri: always.has(c.key) ? 0 : order[c.kind] }))
    .sort((a, b) => a.pri - b.pri || a.i - b.i)
    .map(({ c }) => c);
}
