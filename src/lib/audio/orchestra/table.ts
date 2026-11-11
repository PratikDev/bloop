import { EARTH_CATEGORIES, type EarthCategory } from "@/lib/audio/layers/types";
import table from "./categories.json";

const isCategory = (v: unknown): v is EarthCategory => typeof v === "string" && (EARTH_CATEGORIES as readonly string[]).includes(v);

const RECORDS: ReadonlyMap<string, EarthCategory> = new Map(
  Object.entries(table.records).flatMap(([id, c]): [string, EarthCategory][] => (isCategory(c) ? [[id, c]] : [])),
);
const VOICES: ReadonlyMap<string, EarthCategory | null> = new Map(Object.entries(table.voices).map(([id, c]) => [id, isCategory(c) ? c : null]));

export function getCategory(recordId: string): EarthCategory | null {
  return RECORDS.get(recordId) ?? null;
}

export function categoryOfVoice(voiceId: string): EarthCategory | null {
  return VOICES.get(voiceId) ?? null;
}

export const UNCLASSIFIED: readonly { id: string; reason: string }[] = table.unclassified;

export function recordsIn(category: EarthCategory): string[] {
  return [...RECORDS].filter(([, c]) => c === category).map(([id]) => id);
}
