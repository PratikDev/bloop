import { getCategory } from "@/lib/audio/orchestra";
import { FLAGS } from "@/lib/flags";
import type { BoundT } from "@/lib/i18n";

export function categoryLead(t: BoundT, recordId: string, on: boolean = FLAGS.artOrchestra): string[] {
  const c = on ? getCategory(recordId) : null;
  return c === null ? [] : [t("orchestra.prefix", { system: t(`orchestra.cat.${c}`) })];
}

export function categoryWord(t: BoundT, recordId: string, on: boolean = FLAGS.artOrchestra): string {
  const c = on ? getCategory(recordId) : null;
  return c === null ? "" : t(`orchestra.cat.${c}`);
}
