// The Turntable's strings the app's own translator shows (captions from the sound engine, the measured error, the
// stop announcement). The Turntable's other
// strings are drafts in src/components/Turntable/strings-bn.ts, read only inside the Turntable.

import type { turntableEn } from "../en/turntable";
import { formatFixed, formatInteger } from "../format";
import type { Translated } from "../types";

export const turntableBn: Translated<typeof turntableEn> = {
  // REVIEW FIRST (Pratik, 2026-11-10): describes the sound, so in full Bangla, in the other earcon captions' style.
  "caption.earcon.needleDrop": "সুই নামল: নতুন রেকর্ড",
  // REVIEW FIRST (Pratik, 2026-11-10): the measured error (FrameFacts, the Truth panel) and the stop announcement.
  "turntable.error.rain": (p) => `সাধারণত ~${formatInteger(p.percent, "bn")}%-এর মধ্যে`,
  "turntable.error.ocean": (p) => `মধ্যমা ${formatFixed(p.median, "bn", 2)} °সে, NASA MUR-এর তুলনায় (${formatInteger(p.n, "bn")}টি বিন্দু, সর্বশেষ ফ্রেম)`,
  "turntable.stopped": "থেমেছে। সমতল মানচিত্রে ফেরা হলো।",
};
