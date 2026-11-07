// Bangla strings for the Both-mode frame gap (src/lib/i18n/en/frames.ts). Draft, needs review (bn/drafts.ts).
// The short form reaches a braille display, so its number stays in Western digits.

import type { framesEn } from "../en/frames";
import type { Translated } from "../types";

export const framesBn: Translated<typeof framesEn> = {
  "frameGap.long": (p: { ocean: string; rain: string; apart: string }) => `সমুদ্রের ফ্রেম: ${p.ocean} UTC · বৃষ্টির ফ্রেম: ${p.rain} UTC (${p.apart})`,
  "frameGap.days": (p: { n: string; count: number }) => `${p.n} দিনের ব্যবধান`,
  "frameGap.hours": (p: { n: string; count: number }) => `${p.n} ঘণ্টার ব্যবধান`,
  "frameGap.same": "একই ঘণ্টা",
  "frameGap.label": "দুটি ফ্রেম একই সময়ের নয়",
  "frameGap.short": (p: { which: string; n: string; unit: string }) => `${p.which} ${p.n}${p.unit} নতুন`,
  "frameGap.short.rain": "বৃষ্টি",
  "frameGap.short.ocean": "সমুদ্র",
  "frameGap.short.d": "দি",
  "frameGap.short.h": "ঘ",
  "frameGap.short.same": "একই ঘণ্টা",
  "announce.trackBoth": (p: { gap: string }) => `এখন শুনছেন: দুটোই। ফ্রেম ${p.gap}।`,
};
