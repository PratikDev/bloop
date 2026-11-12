// The credits list (mentor item 5 follow-up): built from the record registry, never typed. See build.ts.

/** A place in the app where sound plays. The braille explorer reads the Listen tracks and the Official records. */
export const CREDIT_PAGES = ["listen", "thenNow", "how", "official", "turntable", "braille"] as const;
export type CreditPage = (typeof CREDIT_PAGES)[number];

/** "Data in this app" is grouped so it stays readable. */
export const CREDIT_GROUPS = ["observations", "models", "svs"] as const;
export type CreditGroup = (typeof CREDIT_GROUPS)[number];

export interface CreditEntry {
  /** A meta/freshness.json dataset id, or the record id for an SVS visualization. */
  id: string;
  /** As the registry spells it (attribution stays English). */
  name: string;
  provider: string;
  /** Landing page or DOI; null = not available. */
  link: string | null;
  /** Where it plays, in CREDIT_PAGES order; empty for a testing-only source. */
  pages: CreditPage[];
  /** The registry products (records) that use it. */
  records: string[];
}

export interface CreditsList {
  data: Record<CreditGroup, CreditEntry[]>;
  /** Sources no playing record uses: built and checked, never played. */
  testing: CreditEntry[];
}
