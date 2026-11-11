// "Where am I?" as text: "Bay of Bengal · 140 km S of Khulna, Bangladesh",
// "Dhaka, Bangladesh". Names use Natural Earth's Bangla where it has one.

import type { Lang } from "@/lib/i18n";
import type { Named, WhereAmI } from "@/lib/geo/gazetteer";
import { roundKm } from "@/lib/geo/spherical";
import type { Place } from "@/lib/geo/types";
import type { TT } from "./i18n";

/** A place name in the UI language when the data has it, with the language it is in. */
export function localName(n: Named | Place, lang: Lang): { text: string; lang: Lang } {
  const bn = "nameBn" in n ? n.nameBn : null;
  return lang === "bn" && bn ? { text: bn, lang: "bn" } : { text: n.name, lang: "en" };
}

/** A place's country in the UI language (Natural Earth's Bangla name when it has one). */
const placeCountry = (p: Place, lang: Lang) => (lang === "bn" && p.countryBn ? p.countryBn : p.country);

export interface PlaceText {
  /** The main name: the city, the sea, or the district and country. */
  name: string;
  /** The whole line, e.g. "Bay of Bengal · 140 km S of Khulna, Bangladesh". */
  line: string;
}

export function placeText(tt: TT, lang: Lang, w: WhereAmI, spoken = false): PlaceText {
  const country = w.country ? localName(w.country, lang).text : null;
  if (w.atCity) {
    const city = localName(w.atCity, lang).text;
    const line = tt("turntable.where.city", { city, country: country ?? placeCountry(w.atCity, lang) });
    return { name: line, line };
  }
  const near = w.nearest
    ? tt(spoken ? "turntable.where.nearSpoken" : "turntable.where.near", {
        km: roundKm(w.nearest.km),
        dir: w.nearest.direction,
        city: localName(w.nearest.place, lang).text,
        country: placeCountry(w.nearest.place, lang),
      })
    : null;
  const district = w.district ? tt("turntable.where.district", { district: w.district }) : null;
  const name = w.sea ? localName(w.sea, lang).text : [district, country].filter(Boolean).join(", ") || null;
  const sep = spoken ? ", " : " · ";
  if (!name) return { name: near ?? tt("turntable.where.unnamed"), line: near ?? tt("turntable.where.unnamed") };
  return { name, line: near ? `${name}${sep}${near}` : name };
}
