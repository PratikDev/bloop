import { formatFixed, formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { FreshnessFile } from "@/types/data-contract";
import type { SourceKind } from "@/types/contract-15/common";
import { sourceDataset } from "./live";

const EQUATOR_KM = 40_075.017;
const FULL_CIRCLE = 360;

const KIND = {
  measurement: "provenance.kind.measurement",
  model: "provenance.kind.model",
  inventory: "provenance.kind.inventory",
} as const satisfies Record<SourceKind, string>;

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
