import { formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import { versionOf } from "@/lib/provenance/live";
import { repoLink, rowLink, VALIDATION_TABLE } from "@/lib/provenance/repo";
import type { Provenance } from "@/lib/provenance/types";
import type { SstMetadata } from "@/types/data-contract";
import { DATA_SCRIPTS } from "./provenance";
import type { MethodManifest } from "./radar";

/** How we got this for the radar method: NASA's movie (the method's evidence) and the ocean frame it is played on. */
export function radarProvenance(t: BoundT, lang: Lang, m: MethodManifest, sst: SstMetadata): Provenance[] {
  return [
    {
      subject: t("earth.radar.subject"),
      dataset: `${m.title} (SVS ${m.svs_ids.join(", ")}); ${sst.source_dataset}`,
      version: versionOf(sst.source_dataset),
      link: m.svs_pages[0] ?? null,
      window: t("hwgt.window.frame", { time: formatUtc(sst.frame_time_utc, lang) }),
      cell: null,
      place: null,
      method: t("earth.radar.method"),
      uncertainty: t("data.text", { text: m.disclosure }),
      n: null,
      status: null,
      scripts: [...DATA_SCRIPTS.radar, "pipeline/svs/export.py"].map((p) => repoLink(p)),
      validation: rowLink(VALIDATION_TABLE, m.record),
      patternOnly: null,
      health: m.record,
    },
  ];
}
