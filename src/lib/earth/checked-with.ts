// The SVS items a record's checks were run against (P6): a check whose title starts with another SVS id ("5479 flat
// maps: …") used that item's frames to check this record. Read from validation.json: credited, never played.
import { svsPage } from "@/lib/credits/build";
import type { OfficialValidationFile } from "@/types/data-contract";

const LEADING_SVS = /^(\d{4,5}) /u;

export interface CheckedWithItem {
  svs: number;
  link: string;
  /** The checks' titles, as the file writes them. */
  checks: string[];
  /** The datasets those checks compared against (each check's `source`). */
  sources: string[];
}

export function checkedWith(v: OfficialValidationFile): CheckedWithItem[] {
  const by = new Map<number, CheckedWithItem>();
  for (const c of v.checks) {
    const m = LEADING_SVS.exec(c.title);
    if (!m) continue;
    const svs = Number(m[1]);
    const item = by.get(svs) ?? { svs, link: svsPage(svs), checks: [], sources: [] };
    item.checks.push(c.title);
    if (c.source && !item.sources.includes(c.source)) item.sources.push(c.source);
    by.set(svs, item);
  }
  return [...by.values()];
}
