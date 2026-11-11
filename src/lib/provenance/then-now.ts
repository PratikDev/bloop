// "How we got this" for a Then vs Now part: the city's record (demo/cities_then_now.json), the statistics
// (thenvsnow/stats.json, which also names its script and its doc) and the water record (context/grace.json).

import { voiceProduct } from "@/lib/credits/surfaces";
import { formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { longLine, partStats } from "@/lib/then-now-stats";
import { windowLabel } from "@/lib/then-now";
import type { Part } from "@/components/ThenNow/use-then-now-player";
import type { CityThenNow, ClimateCellName, DhakaThenNowDemo, FreshnessFile, GraceContextFile, GridCellRef } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";
import { cellCentre } from "./cell";
import { datasetLink, versionOf } from "./live";
import { repoLink, rowLink, SCRIPTS } from "./repo";
import type { Provenance } from "./types";

export interface ThenNowContext {
  t: BoundT;
  lang: Lang;
  freshness: FreshnessFile | null;
  cityName: ClimateCellName;
  /** The city's own record (null while the cities file loads: the demo is Dhaka's). */
  city: CityThenNow | null;
  demo: DhakaThenNowDemo;
  grace: GraceContextFile;
  stats: ThenNowStatsFile | null;
}

/** The water record every city plays (Bangladesh-wide). */
const BOX = "Bangladesh";
const PART_RECORD = { heat: "heat", monsoon: "rain", water: "water" } as const satisfies Record<Part, string>;

function cellText(t: BoundT, lang: Lang, cell: GridCellRef | undefined, shared: readonly ClimateCellName[]): string | null {
  if (!cell) return null;
  const text = cellCentre(t, lang, cell.lat, cell.lon);
  return shared.length ? t("hwgt.cell.shared", { cell: text, cities: shared.map((c) => t(`place.${c}`)).join(", ") }) : text;
}

export function thenNowProvenance(c: ThenNowContext, part: Part): Provenance {
  const { t, lang, stats } = c;
  const place = t(`place.${c.cityName}`);
  const subject = t("hwgt.subject.part", { city: place, part: t(`thenNow.part.${part}`) });
  const uncertainty = stats ? longLine(t, lang, partStats(stats, c.cityName, part)) : null;
  const scripts = stats ? [...new Set([...(part === "water" ? SCRIPTS.water : SCRIPTS.heat), stats.method.script])].map((p) => repoLink(p)) : [];
  const validation = stats ? rowLink(stats.method.doc, `${c.cityName}, ${PART_RECORD[part]}`) : null;
  const link = datasetLink(c.freshness, voiceProduct(part));

  if (part === "water") {
    const box = c.grace.boxes[BOX];
    const w = stats?.water[BOX];
    return {
      subject,
      dataset: c.grace.dataset,
      version: versionOf(c.grace.dataset),
      link,
      window: w ? `${w.trend.years[0]}–${w.trend.years[1]}` : null,
      cell: c.grace.mascon_deg !== null ? t("hwgt.cell.box", { box: t("data.text", { text: BOX }), deg: formatInteger(c.grace.mascon_deg, lang) }) : null,
      place: t("water.bangladeshWide", { deg: c.grace.mascon_deg }),
      method: w ? t("hwgt.method.trend", { test: w.trend.test }) : null,
      uncertainty,
      n: w ? t("hwgt.n.months", { n: formatInteger(w.trend.n, lang) }) : box.months.length ? t("hwgt.n.months", { n: formatInteger(box.months.length, lang) }) : null,
      status: "file",
      scripts,
      validation,
      patternOnly: null,
      health: voiceProduct(part), 
    };
  }

  const heat = part === "heat";
  const record = heat ? c.demo.heat : c.demo.rain.gpcp;
  const cityRecord = heat ? c.city?.heat : c.city?.rain.gpcp;
  const comparison = stats ? (heat ? stats.cities[c.cityName].heat : stats.cities[c.cityName].rain.gpcp) : null;
  const season = stats ? (heat ? stats.cities[c.cityName].heat.season : stats.cities[c.cityName].rain.season) : null;
  const datasets = heat ? record.dataset : `${record.dataset}; ${c.demo.rain.gpcc.dataset}`;
  return {
    subject,
    dataset: datasets,
    version: versionOf(record.dataset),
    link,
    window: t("hwgt.window.two", { a: windowLabel(record.A), b: windowLabel(record.B) }),
    cell: cellText(t, lang, cityRecord?.cell, cityRecord?.same_record_as === null ? (cityRecord?.shares_cell_with ?? []) : []),
    place,
    method: season ? t(heat ? "hwgt.method.decade" : "hwgt.method.rainPct", { season }) : null,
    uncertainty,
    n: comparison ? t("hwgt.n.years", { a: formatInteger(comparison.A.n, lang), b: formatInteger(comparison.B.n, lang) }) : null,
    status: "file",
    scripts,
    validation,
    patternOnly: null,
    health: voiceProduct(part), 
  };
}
