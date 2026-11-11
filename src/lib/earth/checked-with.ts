import { svsPage } from "@/lib/credits/build";
import type { OfficialValidationFile } from "@/types/data-contract";

const LEADING_SVS = /^(\d{4,5}) /u;

interface CheckedWithItem {
  svs: number;
  link: string;
  checks: string[];
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
