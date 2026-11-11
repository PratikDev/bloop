// The spoken provenance line (accessibility core, step 5; spec Part 1.8): each record's NASA product, resolution, date,
// and model or observation, in one sentence for Shift+P and Track 0. Read from the frame's metadata and the dataset
// registry (meta/freshness.json), the same sources "How we got this" uses; nothing is typed.
import { formatFixed, formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { FreshnessFile } from "@/types/data-contract";
import type { SourceKind } from "@/types/contract-15/common";
import { sourceDataset } from "./live";

/** The equator's length (km, WGS 84), for "about N kilometres at the equator". */
const EQUATOR_KM = 40_075.017;
const FULL_CIRCLE = 360;

const KIND = {
  measurement: "provenance.kind.measurement",
  model: "provenance.kind.model",
  inventory: "provenance.kind.inventory",
} as const satisfies Record<SourceKind, string>;

/** One record's line, or null when the registry has no source dataset for it (the line is then not said). */
export function provenanceLine(
  t: BoundT,
  lang: Lang,
  freshness: FreshnessFile | null,
  product: string,
  frame: { frame_time_utc: string; grid: { width: number } },
): string | null {
  const source = sourceDataset(freshness, product);
  if (!source) return null;
  return t("provenance.line", {
    dataset: source.name,
    agency: source.agency,
    kind: t(KIND[source.kind]),
    deg: formatFixed(FULL_CIRCLE / frame.grid.width, lang, 2),
    km: formatInteger(EQUATOR_KM / frame.grid.width, lang),
    time: formatUtc(frame.frame_time_utc, lang),
  });
}
