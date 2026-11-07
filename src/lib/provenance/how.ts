// "How we got this" for the How we know cards: the live frames' checks (as Listen's), plus the rank correlation from
// truth/stats.json, the sounds counted from mapping.json, and the ground-vs-satellite duet (context/globe_duet.json).

import { formatFixed, formatInteger } from "@/lib/i18n";
import type { GlobeDuetFile, RainMetadata, SstMetadata } from "@/types/data-contract";
import type { TruthStatsFile } from "@/types/truth-stats";
import { oceanProvenance, rainProvenance, type LiveContext } from "./live";
import { repoLink, rowLink, SCRIPTS, TRUTH_STATS } from "./repo";
import type { Provenance } from "./types";

const RHO_DECIMALS = 3;

const withRho = (c: LiveContext, p: Provenance, rho: number | undefined, n: number | undefined): Provenance => ({
  ...p,
  place: n !== undefined ? c.t("hwgt.place.checked", { n: formatInteger(n, c.lang) }) : null,
  method: c.t("hwgt.method.pairs"),
  uncertainty: [p.uncertainty, rho !== undefined ? c.t("hwgt.unc.rho", { rho: formatFixed(rho, c.lang, RHO_DECIMALS) }) : null].filter(Boolean).join(" ") || null,
  scripts: [...new Set([...p.scripts.map((s) => s.label), ...SCRIPTS.pairs])].map((s) => repoLink(s)),
});

export const oceanCardProvenance = (c: LiveContext, meta: SstMetadata, stats: TruthStatsFile | null) =>
  withRho(c, oceanProvenance({ ...c, place: null }, meta), stats?.sst.spearman_rho, stats?.sst.n);

export const rainCardProvenance = (c: LiveContext, meta: RainMetadata, stats: TruthStatsFile | null) =>
  withRho(c, rainProvenance({ ...c, place: null }, meta), stats?.rain.spearman_rho, stats?.rain.n);

/** The sound rules card counts the sounds that play; the rules themselves are mapping.json's numbers. */
export function rulesProvenance(c: LiveContext, subject: string, voices: number): Provenance {
  return {
    subject,
    dataset: null,
    version: null,
    link: null,
    window: null,
    cell: null,
    place: null,
    method: c.t("hwgt.method.rules"),
    uncertainty: null,
    n: c.t("hwgt.n.voices", { n: formatInteger(voices, c.lang) }),
    status: null,
    scripts: SCRIPTS.rules.map((p) => repoLink(p)),
    validation: null,
    patternOnly: null,
  };
}

export function globeProvenance(c: LiveContext, subject: string, duet: GlobeDuetFile, stats: TruthStatsFile | null): Provenance {
  const { t, lang } = c;
  return {
    subject,
    dataset: duet.credit,
    version: null,
    link: null,
    window: duet.title,
    cell: null,
    place: t("data.text", { text: duet.region_note }),
    method: t("data.text", { text: duet.disclosure }),
    uncertainty: [
      duet.summary.median_abs_difference_pct !== undefined ? t("hwgt.unc.globe", { median: formatFixed(duet.summary.median_abs_difference_pct, lang, 1) }) : null,
      stats ? t("hwgt.unc.rho", { rho: formatFixed(stats.globe.spearman_rho, lang, RHO_DECIMALS) }) : null,
    ].filter(Boolean).join(" ") || null,
    n: t("hwgt.n.placeDays", { n: formatInteger(duet.summary.unique_place_days, lang) }),
    status: "observation",
    scripts: SCRIPTS.globe.map((p) => repoLink(p)),
    // No VALIDATION_TABLE.md row: the rank correlation is the pipeline's own output (truth_stats.py).
    validation: rowLink(TRUTH_STATS, "globe"),
    patternOnly: null,
  };
}
