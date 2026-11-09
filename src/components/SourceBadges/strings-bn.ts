// DRAFT Bangla for the source and data-age badges, written by the developer, NEEDS TRANSLATOR
// REVIEW (docs/L3/bangla-strings.md). Merged into the Turntable's drafts; the flat map stays English.

import type { badgesEn } from "@/lib/i18n/en/badges";
import { formatInteger } from "@/lib/i18n/format";

type Table = typeof badgesEn;

export const badgesBnDraft: { [K in keyof Table]?: Table[K] } = {
  "badge.sources": "উৎস",
  "badge.model": "মডেলের অনুমান",
  "badge.measurement": "পরিমাপ",
  "badge.framePaired": "ফ্রেমের সঙ্গে যুক্ত",
  "badge.context": "প্রেক্ষাপট",
  "badge.agency.ground": "ভূমি",
  "badge.agency.other": "অন্য সংস্থা",
  "badge.partly": "আংশিক স্বাধীন: কিছু ইনপুট এক",
  "badge.latest": (p) => `সর্বশেষ পাওয়া: ${p.age}`,
  "badge.hours": (p) => `${formatInteger(p.n, "bn")} ঘণ্টা আগের`,
  "badge.days": (p) => `${p.n.toLocaleString("bn-BD", { maximumFractionDigits: 1 })} দিন আগের`,
  "badge.recorded": (p) => `রেকর্ড করা (${p.age}): সতেজতার সীমার চেয়ে পুরোনো`,
  "badge.baseline": (p) => `রেকর্ড ${p.from} থেকে ${p.to}`,
  "badge.missing": "এখনও প্রকাশিত হয়নি",
};
