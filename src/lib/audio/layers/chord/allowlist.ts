// The chord's per-record allowlist, generated from each record's colour bar (pipeline/stats/chord_allowlist.py →
// public/data/meta/chord_allowlist.json): "full", "modes-only" (a jet-like bar with a dark low end) or "none".
import file from "../../../../../public/data/meta/chord_allowlist.json";

export type ChordAllowance = "full" | "modes-only" | "none";

export interface AllowRow {
  record: string;
  layer?: string;
  voice: string;
  class: string;
  chord: ChordAllowance;
}

const ROWS: readonly AllowRow[] = file.records.map((r) => ({ ...r, chord: r.chord === "full" || r.chord === "modes-only" ? r.chord : "none" }));

/** A record's allowance (and its layer's, when the record has several); "none" when it isn't listed. */
export function allowanceOf(record: string, layer?: string): ChordAllowance {
  const rows = ROWS.filter((r) => r.record === record);
  return (rows.find((r) => r.layer === layer) ?? rows[0])?.chord ?? "none";
}
