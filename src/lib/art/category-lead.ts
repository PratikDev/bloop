// Earth Orchestra's category word, which leads a record's Describe text and braille line ("Ocean." first), when the
// feature is on. Empty for an unplaced record or with the flag off, so nothing else changes.

import { getCategory } from "@/lib/audio/orchestra";
import { FLAGS } from "@/lib/flags";
import type { BoundT } from "@/lib/i18n";

/** [] or ["Ocean."]: spread it in front of a description's sentences. */
export function categoryLead(t: BoundT, recordId: string, on: boolean = FLAGS.artOrchestra): string[] {
  const c = on ? getCategory(recordId) : null;
  return c === null ? [] : [t("orchestra.prefix", { system: t(`orchestra.cat.${c}`) })];
}

/** The category name alone (braille lines lead with it), or "". */
export function categoryWord(t: BoundT, recordId: string, on: boolean = FLAGS.artOrchestra): string {
  const c = on ? getCategory(recordId) : null;
  return c === null ? "" : t(`orchestra.cat.${c}`);
}
