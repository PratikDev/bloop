import type { PlaceNamers } from "@/lib/describe/facts";
import { loadGeo, type GeoData } from "@/lib/geo/load";
import type { Lang } from "@/lib/i18n";
import { localName, placeText } from "../Turntable/place-text";
import { ttFor } from "../Turntable/i18n";

const GEO_WAIT_MS = 3000;

export const loadGeoSoon = (): Promise<GeoData | null> =>
  Promise.race([loadGeo(), new Promise<null>((resolve) => setTimeout(() => resolve(null), GEO_WAIT_MS))]).catch(() => null);

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
