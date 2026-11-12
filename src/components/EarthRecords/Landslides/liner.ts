import { clean } from "@/a11y/brailleText";
import type { BoundT } from "@/lib/i18n";
import type { LandslideClassMetadata } from "@/types/data-contract";

/** The landslide record's liner notes, from the product's own header. */
export const slideLinerNotes = (t: BoundT, meta: LandslideClassMetadata): string[] => [
  clean(t("earth.slide.title")),
  clean(t("earth.slide.label")),
  "",
  clean(meta.title),
  clean(meta.disclosure),
  clean(`${t("official.credits")}: ${meta.credit}`),
];
