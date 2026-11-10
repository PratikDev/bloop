import { clean } from "@/a11y/brailleText";
import type { BoundT } from "@/lib/i18n";
import type { NightLightsFile } from "@/types/data-contract";

/** The night-lights record's liner notes, from the file's own header. */
export const lightsLinerNotes = (t: BoundT, file: NightLightsFile): string[] => [
  clean(t("earth.lights.title")),
  clean(t("earth.lights.label")),
  "",
  clean(file.title),
  clean(`${file.short_name}: ${file.variable}, ${file.units}`),
  clean(file.quality_rule),
  clean(file.disclosure),
  clean(`${t("official.credits")}: ${file.credit}`),
];
