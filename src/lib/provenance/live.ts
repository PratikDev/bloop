// "How we got this" for the live frames (Listen, the Turntable's records): the frame's own metadata (latest/sst.json,
// latest/rain.json) and the registry's dataset link (meta/freshness.json). Nothing is typed here.

import { voiceSpec } from "@/lib/audio/mapping";
import { frameGap, gapLong } from "@/lib/frame-gap";
import { formatFixed, formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import { oceanTruth, rainTruth } from "@/lib/truth";
import type { FreshnessFile, RainMetadata, SstMetadata } from "@/types/data-contract";
import { repoLink, rowLink, SCRIPTS, VALIDATION_TABLE } from "./repo";
import type { Provenance } from "./types";

const FULL_CIRCLE = 360;
const FRAME = /^(svs|eic_)/u;
/** "MUR-JPL-L4-GLOB-v4.1 (…)" → "v4.1"; "GPM IMERG half-hourly V07 (…)" → "V07"; "… RL06.3Mv04 CRI" → "RL06.3Mv04". */
const VERSION = /\b(?:RL\d+(?:\.\d+)*M?v\d+|[vV]\d+(?:\.\d+)*)\b/u;

export const versionOf = (name: string): string | null => VERSION.exec(name)?.[0] ?? null;

/** The registry's entry for the data a product plays: its first dataset that isn't the SVS frame itself. */
export function sourceDataset(freshness: FreshnessFile | null, product: string | undefined) {
  const entry = product ? freshness?.products[product] : undefined;
  return entry?.datasets.find((d) => !FRAME.test(d.id)) ?? null;
}

/** The registry's link for the data a product plays. */
export function datasetLink(freshness: FreshnessFile | null, product: string | undefined): string | null {
  return sourceDataset(freshness, product)?.url ?? null;
}

const gridCell = (t: BoundT, lang: Lang, grid: { width: number; height: number; aggregation: string }) =>
  t("hwgt.cell.frame", {
    deg: formatFixed(FULL_CIRCLE / grid.width, lang, 2),
    width: formatInteger(grid.width, lang),
    height: formatInteger(grid.height, lang),
    aggregation: t("data.text", { text: grid.aggregation }),
  });

export interface LiveContext {
  t: BoundT;
  lang: Lang;
  freshness: FreshnessFile | null;
  /** The cursor's place, as the page shows it; null when the group isn't about one point. */
  place: string | null;
}

export function oceanProvenance({ t, lang, freshness, place }: LiveContext, meta: SstMetadata): Provenance {
  const truth = oceanTruth(meta);
  const v = meta.verified;
  return {
    subject: t("hwgt.subject.ocean"),
    dataset: meta.source_dataset,
    version: versionOf(meta.source_dataset),
    link: datasetLink(freshness, voiceSpec("ocean").source.product),
    window: t("hwgt.window.frame", { time: formatUtc(meta.frame_time_utc, lang) }),
    cell: gridCell(t, lang, meta.grid),
    place: place ? t("hwgt.place.cursor", { place }) : null,
    method: t("hwgt.method.frame", { aggregation: t("data.text", { text: meta.grid.aggregation }) }),
    uncertainty:
      truth && v.p90_abs_error_C !== undefined && v.bias_C !== undefined
        ? t("hwgt.unc.sst", { median: formatFixed(truth.median, lang, 2), p90: formatFixed(v.p90_abs_error_C, lang, 2), bias: formatFixed(v.bias_C, lang, 2) })
        : null,
    n: t("hwgt.n.points", { n: formatInteger(v.n_points, lang) }),
    status: truth ? "verified" : null,
    scripts: SCRIPTS.sst.map((p) => repoLink(p)),
    validation: rowLink(VALIDATION_TABLE, "live_sst"),
    patternOnly: null,
    health: "sst", // >>> DATA <<< DATA
    liveCheck: "live_sst", // >>> DATA <<< DATA
  };
}

export function rainProvenance({ t, lang, freshness, place }: LiveContext, meta: RainMetadata): Provenance {
  const truth = rainTruth(meta);
  return {
    subject: t("hwgt.subject.rain"),
    dataset: meta.source_dataset,
    version: versionOf(meta.source_dataset),
    link: datasetLink(freshness, voiceSpec("rain").source.product),
    window: t("hwgt.window.rainFrame", { time: formatUtc(meta.frame_time_utc, lang), meaning: t("data.text", { text: meta.frame_time_meaning }) }),
    cell: gridCell(t, lang, meta.grid),
    place: place ? t("hwgt.place.cursor", { place }) : null,
    method: t("hwgt.method.rainFrame", { aggregation: t("data.text", { text: meta.grid.aggregation }), formula: meta.grid.formula }),
    uncertainty: Number.isFinite(truth.percent) ? t("hwgt.unc.rain", { percent: formatInteger(truth.percent, lang), agree: formatInteger(truth.agreedPct, lang) }) : null,
    n: t("hwgt.n.points", { n: formatInteger(truth.points, lang) }),
    // The rain check states its error as a percentage (no pass threshold): values with stated error.
    status: Number.isFinite(truth.percent) ? "values with stated error" : null,
    scripts: SCRIPTS.rain.map((p) => repoLink(p)),
    validation: rowLink(VALIDATION_TABLE, "live_rain"),
    patternOnly: null,
    health: "rain", // >>> DATA <<< DATA
    liveCheck: "live_rain", // >>> DATA <<< DATA
  };
}

/** Both mode: how far apart the two frames are (src/lib/frame-gap.ts), from the two frames' own times. */
export function gapProvenance({ t, lang }: LiveContext, sst: SstMetadata, rain: RainMetadata): Provenance | null {
  const gap = frameGap(sst.frame_time_utc, rain.frame_time_utc);
  if (!gap) return null;
  return {
    subject: t("hwgt.subject.gap"),
    dataset: `${sst.source_dataset}; ${rain.source_dataset}`,
    version: null,
    link: null,
    window: t("hwgt.window.two", { a: formatUtc(sst.frame_time_utc, lang), b: formatUtc(rain.frame_time_utc, lang) }),
    cell: null,
    place: null,
    method: `${t("hwgt.method.gap")} ${gapLong(t, lang, gap)}`,
    uncertainty: t("hwgt.unc.gap"),
    n: null,
    status: null,
    scripts: SCRIPTS.gap.map((p) => repoLink(p)),
    validation: null,
    patternOnly: null,
  };
}
