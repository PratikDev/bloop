import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { formatDay, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import type { Provenance } from "@/lib/provenance/types";
import type { NightLightsFile } from "@/types/data-contract";
import { LIGHTS_VOICE } from "./nightlights";
import { DATA_SCRIPTS, headerProvenance } from "./provenance";

export function lightsProvenance(t: BoundT, lang: Lang, file: NightLightsFile, city: string): Provenance {
  const c = file.cities[city];
  return headerProvenance({
    t,
    lang,
    header: file,
    subject: `${t("earth.lights.subject")}: ${t("data.text", { text: city })}`,
    window: c?.days.length ? t("hwgt.window.two", { a: formatDay(c.days[0], lang), b: formatDay(c.days[c.days.length - 1], lang) }) : null,
    cell: `${c?.tile ?? ""} (${file.variable})`,
    place: c ? t("place.latlon", { lat: c.lat, lon: c.lon }) : null,
    method: t("earth.lights.method", { window: formatInteger(file.window_px, lang), rule: ruleText(voiceSpec(LIGHTS_VOICE)) }),
    uncertainty: `${t("data.text", { text: file.quality_rule })}. ${t("data.text", { text: file.disclosure })}`,
    n: c ? c.radiance.filter((r) => r !== null).length : null,
    scripts: DATA_SCRIPTS.lights,
  });
}
