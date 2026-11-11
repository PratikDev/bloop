import file from "../../../../../public/data/meta/chord_allowlist.json";

export type ChordAllowance = "full" | "modes-only" | "none";

interface AllowRow {
  record: string;
  layer?: string;
  voice: string;
  class: string;
  chord: ChordAllowance;
}

const ROWS: readonly AllowRow[] = file.records.map((r) => ({ ...r, chord: r.chord === "full" || r.chord === "modes-only" ? r.chord : "none" }));

export function allowanceOf(record: string, layer?: string): ChordAllowance {
  const rows = ROWS.filter((r) => r.record === record);
  return (rows.find((r) => r.layer === layer) ?? rows[0])?.chord ?? "none";
}
