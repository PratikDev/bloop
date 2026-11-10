import { formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { Provenance } from "@/lib/provenance/types";
import type { LandslideClassMetadata } from "@/types/data-contract";
import { DATA_SCRIPTS, headerProvenance } from "./provenance";

/** How we got this for the landslide class at the needle: the product's header and its acceptance check. */
export const slideProvenance = (t: BoundT, lang: Lang, meta: LandslideClassMetadata, place: string): Provenance =>
  headerProvenance({
    t,
    lang,
    header: meta,
    subject: t("earth.slide.subject"),
    window: t("hwgt.window.frame", { time: formatUtc(meta.frame_time_utc, lang) }),
    cell: t("earth.fire.cell"),
    place,
    method: t("earth.slide.method"),
    uncertainty: `${t("earth.slide.label")} ${t("data.text", { text: meta.disclosure })}`,
    n: null,
    scripts: DATA_SCRIPTS.landslide,
    liveCheck: "live_landslide_class",
  });
