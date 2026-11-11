import { clean } from "@/a11y/brailleText";
import type { FireData } from "@/lib/earth/fire-data";
import type { BoundT } from "@/lib/i18n";

export function fireLinerNotes(t: BoundT, data: FireData): string[] {
  return [
    clean(t("earth.fire.title")),
    clean(t("earth.fire.fwiLabel")),
    clean(t("earth.fire.pixelNote")),
    "",
    ...[data.fwi.meta, data.daily, data.fires].flatMap((h) => [clean(h.title), clean(h.disclosure), clean(`${t("official.credits")}: ${h.credit}`)]),
  ];
}
