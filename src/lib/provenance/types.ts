// "How we got this" (mentor item 11): where a number comes from, in one shape for every page. Every field is read
// from a manifest, a metadata file or stats.json by the builders beside this file; null = "not available" on screen,
// never a guess. src/components/HowWeGotThis renders it.

import type { OfficialStatus } from "@/types/data-contract";
import type { LiveCheckRecord } from "./live-checks";

/** The validation status shown: an Official layer's status, or "file" for a value read straight from the data file
 * (no picture decoded, so nothing to check the decoding against). */
export type ProvenanceStatus = OfficialStatus | "file";

export interface ProvenanceLink {
  label: string;
  href: string;
}

export interface Provenance {
  /** What the numbers are, e.g. "Dhaka rain change" (the button reads "How we got this: Dhaka rain change"). */
  subject: string;
  dataset: string | null;
  version: string | null;
  link: string | null;
  window: string | null;
  cell: string | null;
  place: string | null;
  /** The formula or step in plain words. */
  method: string | null;
  uncertainty: string | null;
  n: string | null;
  status: ProvenanceStatus | null;
  /** The pipeline script(s) that made the numbers, and the validation row that checks them. */
  scripts: ProvenanceLink[];
  validation: ProvenanceLink | null;
  /** Set when no number is shown: why (pattern-only records). */
  patternOnly: string | null;
  /** The record's id in meta/health.json ("sst", an Official record id, …): its "Is this data fresh?" section. */
  health?: string;
  /** A live frame's acceptance check (public/data/official/<liveCheck>/validation.json), read from the file. */
  liveCheck?: LiveCheckRecord;
}

/** Every Provenance field a reader checks for "not available" (the report lists records with any of these null). */
export const FACT_FIELDS = ["dataset", "version", "link", "window", "cell", "place", "method", "uncertainty", "n", "status", "validation"] as const satisfies readonly (keyof Provenance)[];
