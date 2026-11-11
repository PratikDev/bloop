// Place names for text about the map, from the shared gazetteer: a full line ("Bay of Bengal, 140 kilometres south of
// Khulna") for one spot, and a region (the Bangladesh district, else the country, else the sea) for chapters. Used by
// the descriptions and the timed text tracks, so both name a place the same way.
import type { PlaceNamers } from "@/lib/describe/facts";
import { loadGeo, type GeoData } from "@/lib/geo/load";
import type { Lang } from "@/lib/i18n";
import { localName, placeText } from "../Turntable/place-text";
import { ttFor } from "../Turntable/i18n";

/** How long text about the map waits for the gazetteer the first time before it says coordinates instead (design choice). */
const GEO_WAIT_MS = 3000;

/** The gazetteer, or null if it fails or takes longer than GEO_WAIT_MS. */
export const loadGeoSoon = (): Promise<GeoData | null> =>
  Promise.race([loadGeo(), new Promise<null>((resolve) => setTimeout(() => resolve(null), GEO_WAIT_MS))]).catch(() => null);

/** The namers for a language; with no gazetteer (it failed to load), both give null and callers say coordinates. */
export function placeNamers(geo: GeoData | null, lang: Lang): PlaceNamers {
  return {
    name: (at) => (geo ? placeText(ttFor(lang), lang, geo.gazetteer.whereAmI(at), true).line : null),
    region: (at) => {
      if (!geo) return null;
      const w = geo.gazetteer.whereAmI(at);
      if (w.district) return w.district;
      const area = w.country ?? w.sea;
      return area ? localName(area, lang).text : null;
    },
  };
}
