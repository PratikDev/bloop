import type { framesEn } from "../en/frames";
import { formatInteger } from "../format";
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
  "water.bangladeshWide": (p: { deg: number | null }) =>
    `ভূগর্ভস্থ পানি (GRACE) সারা বাংলাদেশের${p.deg === null ? "" : ` (ম্যাসকন প্রায় ${formatInteger(p.deg, "bn")}°)`}, কোনো শহরের নিজস্ব নয়: প্রতিটি শহরের জন্য একই।`,
  "announce.trackBoth": (p: { gap: string }) => `এখন শুনছেন: দুটোই। ফ্রেম ${p.gap}।`,
};
