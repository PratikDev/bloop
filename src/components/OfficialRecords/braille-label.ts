import { abbrev, clean } from "@/a11y/brailleText";
import type { OfficialIndexRow } from "@/types/data-contract";

/** Words a short label can drop without losing what the record is. */
const SMALL = new Set(["a", "an", "the", "of", "by", "from", "and", "in", "on", "for", "to", "with", "at"]);

/** A record card's braille form (aria-braillelabel): SVS ID, the title's first two content words and the badge. */
export function recordBrailleLabel(r: OfficialIndexRow): string {
  const words = clean(r.title.replace(/\(.*?\)/gu, "")).split(" ").filter((w) => w && !SMALL.has(w.toLowerCase()));
  return clean(`${r.svs_ids[0] ?? ""} ${words.slice(0, 2).join(" ")} ${abbrev(r.badge)}`);
}
