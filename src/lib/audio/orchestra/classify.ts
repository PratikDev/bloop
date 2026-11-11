// PURE: Earth Orchestra's category rules. A record's Earth system comes from its own words
// (title, then layer labels), through the ordered keyword rules below; the first rule that matches wins. A record the
// rules can't place, or whose layers fall into different systems, is left unclassified (never guessed): it plays
// plain tones and is listed in categories.json and the report.

import type { EarthCategory } from "@/lib/audio/layers/types";

interface CategoryRule {
  category: EarthCategory;
  /** Case-insensitive; matched against the record's words. */
  pattern: RegExp;
  /** Why this rule exists (shown in categories.json). */
  why: string;
}

/** Ordered: specific rules first (e.g. the ozone layer is atmosphere, not air quality at the ground). */
export const CATEGORY_RULES: readonly CategoryRule[] = [
  { category: "air", pattern: /ozone layer/i, why: "the stratospheric ozone layer is the atmosphere, not air quality at the ground" },
  {
    category: "fire",
    pattern: /fire|smoke|burn|aerosol|pm ?2\.?5|particulate|pollution|air quality|surface ozone|near-surface ozone|\bozone\b|nitrogen|\bno2\b|\bnox\b|carbon monoxide|\bco\b(?!₂|2)|tempo/i,
    why: "fire, smoke and air quality",
  },
  {
    category: "people",
    pattern: /night ?lights?|black marble|earth at night|carbon dioxide|co₂|co2|greenhouse|keeling/i,
    why: "people and carbon: night lights and CO₂",
  },
  { category: "ice", pattern: /grace|glacier|\bice\b|water storage|groundwater|hydrological/i, why: "ice and water storage" },
  { category: "land", pattern: /vegetation|ndvi|forest|gedi|soil|landslide|crop|biomass/i, why: "land and life" },
  {
    category: "ocean",
    pattern: /sea surface|\bsst\b|ocean|current|salinity|sea level|gulf stream|kuroshio|agulhas|oisst/i,
    why: "the ocean",
  },
  {
    category: "air",
    pattern: /gistemp|rain|precipitation|imerg|gpm|wind|humidity|lightning|atmospheric river|water vapou?r|hurricane|storm|cloud|snow|monsoon|temperature|climate/i,
    why: "air and weather",
  },
];

interface CategoryMatch {
  category: EarthCategory;
  /** The words that matched (for the table). */
  matched: string;
}

/** The first rule matching `text`, or null. */
function matchCategory(text: string): CategoryMatch | null {
  for (const rule of CATEGORY_RULES) {
    const m = rule.pattern.exec(text);
    if (m) return { category: rule.category, matched: m[0] };
  }
  return null;
}

export interface RecordWords {
  id: string;
  title: string;
  layers: readonly string[];
}

export type Classified =
  | { id: string; category: EarthCategory; from: "title" | "layers"; matched: string }
  | { id: string; category: null; reason: "no rule matches" | "layers in different systems" };

/** The title decides; without a match, every layer must agree. */
export function classifyRecord(r: RecordWords): Classified {
  const byTitle = matchCategory(r.title);
  if (byTitle) return { id: r.id, category: byTitle.category, from: "title", matched: byTitle.matched };
  const byLayer = r.layers.map(matchCategory);
  if (!byLayer.length || byLayer.some((m) => m === null)) return { id: r.id, category: null, reason: "no rule matches" };
  const found = byLayer as CategoryMatch[];
  const first = found[0].category;
  if (found.some((m) => m.category !== first)) return { id: r.id, category: null, reason: "layers in different systems" };
  return { id: r.id, category: first, from: "layers", matched: found.map((m) => m.matched).join(", ") };
}

/** Method records take the category of the voice they are applied to (`appliedTo`: method record → voice id). */
export function withMethods(classified: readonly Classified[], appliedTo: Readonly<Record<string, string>>): Classified[] {
  return classified.map((c) => {
    const voice = appliedTo[c.id];
    const host = voice === undefined ? undefined : classified.find((x) => x.id === voice);
    return host?.category ? { id: c.id, category: host.category, from: "title", matched: `method applied to the ${voice} voice` } : c;
  });
}
