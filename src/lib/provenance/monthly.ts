// "How we got this" for Then vs Now's Month by month view: the place's monthly record as src/lib/history.ts reads it
// from the context files (Bangladesh) or the global layers (world places).

import { voiceProduct } from "@/lib/credits/surfaces";
import { formatFixed, formatInteger, formatMonth, type BoundT, type Lang } from "@/lib/i18n";
import { HISTORY_VOICE, type HistoryMetric, type PlaceSeries } from "@/lib/history";
import type { FreshnessFile, GraceContextFile } from "@/types/data-contract";
import { cellCentre } from "./cell";
import { datasetLink, versionOf } from "./live";
import { repoLink, SCRIPTS } from "./repo";
import type { Provenance } from "./types";

interface MonthlyContext {
  t: BoundT;
  lang: Lang;
  freshness: FreshnessFile | null;
  metric: HistoryMetric;
  placeName: string;
  world: boolean;
  series: PlaceSeries;
  grace: GraceContextFile;
}

const SIGMA_DECIMALS = 1;

function cell(c: MonthlyContext): string | null {
  const { t, lang, series } = c;
  if (series.source.kind === "cell") return cellCentre(t, lang, series.source.lat, series.source.lon);
  if (series.source.label) return t("data.text", { text: series.source.label });
  return c.grace.mascon_deg !== null ? t("hwgt.cell.box", { box: t("data.text", { text: "Bangladesh" }), deg: formatInteger(c.grace.mascon_deg, lang) }) : null;
}

export function monthlyProvenance(c: MonthlyContext): Provenance {
  const { t, lang, series, metric } = c;
  const sigma = metric === "water" && !c.world ? c.grace.boxes.Bangladesh.uncertainty_1sigma_cm : null;
  const measured = series.values.filter((v) => v !== null).length;
  return {
    subject: t("hwgt.subject.part", { city: c.placeName, part: t(`history.${metric}`) }),
    dataset: series.dataset,
    version: versionOf(series.dataset),
    link: datasetLink(c.freshness, voiceProduct(HISTORY_VOICE[metric])),
    window: series.months.length ? t("hwgt.window.two", { a: formatMonth(series.months[0], lang), b: formatMonth(series.months[series.months.length - 1], lang) }) : null,
    cell: cell(c),
    place: c.placeName,
    method: t("hwgt.method.monthly"),
    uncertainty: sigma
      ? t("hwgt.unc.sigma", { median: formatFixed(sigma.median, lang, SIGMA_DECIMALS), min: formatFixed(sigma.min, lang, SIGMA_DECIMALS), max: formatFixed(sigma.max, lang, SIGMA_DECIMALS) })
      : null,
    n: t("hwgt.n.months", { n: formatInteger(measured, lang) }),
    status: "file",
    scripts: (c.world ? SCRIPTS.world : metric === "water" ? SCRIPTS.water : SCRIPTS.monthly).map((p) => repoLink(p)),
    validation: null,
    patternOnly: null,
    health: voiceProduct(HISTORY_VOICE[metric]), 
  };
}
