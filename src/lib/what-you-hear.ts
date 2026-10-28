// "What you're hearing" (idea A2): one line per live voice, built only from its mapping.json rule
// and the frame's JSON check. No typed numbers, no AI text. Shown under each frame label and on
// the turntable's card, so it is also the screen reader's description of the sound.

import { continuousRule, semitonesPerUnit } from "@/lib/audio/mapping";
import type { LiveFields } from "@/lib/data";
import type { BoundT } from "@/lib/i18n";
import { oceanTruth, rainTruth } from "@/lib/truth";

export function hearLine(t: BoundT, voice: "ocean" | "rain", fields: LiveFields): string | null {
  if (voice === "ocean") {
    const perDegree = semitonesPerUnit(continuousRule("ocean"));
    if (perDegree === null) return null;
    return t("hear.ocean", { degreesPerSemitone: 1 / perDegree, median: oceanTruth(fields.sst.meta)?.median ?? null });
  }
  if (!fields.rain) return null;
  const rule = continuousRule("rain");
  const percent = rainTruth(fields.rain.meta).percent;
  return t("hear.rain", { min: rule.input.min, max: rule.input.max, percent: Number.isFinite(percent) ? percent : null });
}
