// "How we got this" for the DATA views (mentor item 11's shape, src/lib/provenance/types.ts): every field from a
// shipped file's header, never typed. null = "not available" on screen.

import { versionOf } from "@/lib/provenance/live";
import { repoLink, rowLink, SCRIPTS, VALIDATION_TABLE } from "@/lib/provenance/repo";
import type { Provenance } from "@/lib/provenance/types";
import type { LiveCheckRecord } from "@/lib/provenance/live-checks";
import { formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { ProductHeader } from "@/types/data-contract";

/** Where the DATA products are made (pipeline scripts) and decoded (app modules). */
export const DATA_SCRIPTS = {
  fwi: ["pipeline/products/fire/fwi.py", "src/lib/earth/fwi.ts"],
  firms: ["pipeline/products/fire/firms_daily.py", "src/lib/earth/firms.ts", "src/lib/earth/geiger.ts"],
  fires: ["pipeline/products/fire/fires_frame.py"],
  landslide: ["pipeline/products/disasters/landslide.py", "src/lib/earth/landslide.ts"],
  lights: ["pipeline/products/energy/nightlights.py", "src/lib/earth/nightlights.ts"],
  radar: ["src/lib/audio-jukebox/radial-sweep.ts", "src/lib/earth/radar.ts"],
  pilot: ["src/lib/earth/pilot.ts"],
} as const;

export interface HeaderFacts {
  t: BoundT;
  lang: Lang;
  header: ProductHeader;
  subject: string;
  window: string | null;
  cell: string | null;
  place: string | null;
  method: string;
  uncertainty: string | null;
  n: number | null;
  scripts: readonly string[];
  liveCheck?: LiveCheckRecord;
}

/** A product's provenance from its own header (datasets, credit, times) and the caller's words for the method. */
export function headerProvenance(f: HeaderFacts): Provenance {
  const names = f.header.datasets.map((d) => d.name).join("; ");
  const link = f.header.datasets.find((d) => d.url)?.url ?? null;
  const model = f.header.datasets.some((d) => d.kind !== "measurement");
  return {
    subject: f.subject,
    dataset: names || null,
    version: names ? versionOf(names) : null,
    link,
    window: f.window ?? (f.header.source_time_utc ? f.t("earth.hwgt.sourceTime", { time: formatUtc(f.header.source_time_utc, f.lang) }) : null),
    cell: f.cell,
    place: f.place,
    method: f.method,
    uncertainty: f.uncertainty ?? f.t("data.text", { text: f.header.disclosure }),
    n: f.n === null ? null : f.t("hwgt.n.points", { n: formatInteger(f.n, f.lang) }),
    status: model ? "no check" : "file",
    scripts: f.scripts.map((p) => repoLink(p)),
    validation: f.liveCheck ? rowLink(VALIDATION_TABLE, f.liveCheck) : null,
    patternOnly: null,
    health: f.header.product,
    liveCheck: f.liveCheck,
  };
}

/** The "Not playable" list: related/index.json's hidden rows and the pipeline's reasons. */
export function hiddenProvenance(t: BoundT, lang: Lang, count: number): Provenance {
  return {
    subject: t("earth.notPlayable.subject"),
    dataset: t("earth.notPlayable.dataset"),
    version: null,
    link: null,
    window: null,
    cell: null,
    place: null,
    method: t("earth.notPlayable.method"),
    uncertainty: null,
    n: t("earth.notPlayable.n", { n: formatInteger(count, lang) }),
    status: null,
    scripts: SCRIPTS.related.map((p) => repoLink(p)),
    validation: null,
    patternOnly: null,
  };
}
