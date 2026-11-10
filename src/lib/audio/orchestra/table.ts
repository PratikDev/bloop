// PURE: the generated category table (categories.json, scripts/orchestra-categories.ts) as lookups. null = not
// classified: plain tones, never a guess.

import { EARTH_CATEGORIES, type EarthCategory } from "@/lib/audio/layers/types";
import table from "./categories.json";

const isCategory = (v: unknown): v is EarthCategory => typeof v === "string" && (EARTH_CATEGORIES as readonly string[]).includes(v);

const RECORDS: ReadonlyMap<string, EarthCategory> = new Map(
  Object.entries(table.records).flatMap(([id, c]): [string, EarthCategory][] => (isCategory(c) ? [[id, c]] : [])),
);
const VOICES: ReadonlyMap<string, EarthCategory | null> = new Map(Object.entries(table.voices).map(([id, c]) => [id, isCategory(c) ? c : null]));

/** A record's Earth system (Official/Related record id, or a Listen / Then vs Now voice id), or null. */
export function getCategory(recordId: string): EarthCategory | null {
  return RECORDS.get(recordId) ?? null;
}

/** A sound rule's Earth system when every record using it agrees; null when shared across systems or unknown. */
export function categoryOfVoice(voiceId: string): EarthCategory | null {
  return VOICES.get(voiceId) ?? null;
}

/** The records the rules couldn't place (shown in the report and the legend's footnote). */
export const UNCLASSIFIED: readonly { id: string; reason: string }[] = table.unclassified;

/** Every classified record id, by category (the Official grid's groups, the tests). */
export function recordsIn(category: EarthCategory): string[] {
  return [...RECORDS].filter(([, c]) => c === category).map(([id]) => id);
}
