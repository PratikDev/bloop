// The Turntable's strings the app's own translator shows (captions from the sound engine). The Turntable's other
// strings are drafts in src/components/Turntable/strings-bn.ts, read only inside the Turntable.

import type { turntableEn } from "../en/turntable";
import type { Translated } from "../types";

export const turntableBn: Translated<typeof turntableEn> = {
  // REVIEW FIRST (Pratik, 2026-11-10): describes the sound, so in full Bangla, in the other earcon captions' style.
  "caption.earcon.needleDrop": "সুই নামল: নতুন রেকর্ড",
};
