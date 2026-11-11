import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { repoLink, rowLink, VALIDATION_TABLE } from "@/lib/provenance/repo";
import type { Provenance } from "@/lib/provenance/types";
import type { Bounds } from "./boxes";
import type { BoxStats } from "./box-stats";

const READ_SCRIPTS = ["src/lib/cv/box-stats.ts", "pipeline/tests/test_box_stats.py", "pipeline/stats/error_budget.py"] as const;

const deg = (v: number, lang: Lang, pos: string, neg: string) => `${formatFixed(Math.abs(v), lang, 1)}° ${v >= 0 ? pos : neg}`;

function boundsText(lang: Lang, [w, s, e, n]: Bounds): string {
  const lat = `${deg(s, lang, "N", "S")} – ${deg(n, lang, "N", "S")}`;
  const lon = `${deg(w, lang, "E", "W")} – ${deg(e, lang, "E", "W")}`;
  return `${lat}, ${lon}`;
}

export function readProvenance(t: BoundT, lang: Lang, base: Provenance | null, box: { name: string; bounds: Bounds }, stats: BoxStats | null, budgetText: string): Provenance {
  return {
    subject: t("cv.hwgt.subject"),
    dataset: base?.dataset ?? null,
    version: base?.version ?? null,
    link: base?.link ?? null,
    window: base?.window ?? null,
    cell: base?.cell ?? null,
    place: t("cv.hwgt.place", { box: box.name, bounds: boundsText(lang, box.bounds) }),
    method: t("cv.hwgt.method"),
    uncertainty: t("cv.hwgt.unc", { budget: budgetText }),
    n: stats ? t("cv.hwgt.n", { n: formatInteger(stats.n, lang), valid: formatInteger(stats.valid, lang) }) : null,
    status: base?.status ?? null,
    scripts: READ_SCRIPTS.map((s) => repoLink(s)),
    validation: base?.validation ?? null,
    patternOnly: base?.patternOnly ?? null,
  };
}

export function budgetProvenance(t: BoundT): Provenance {
  return {
    subject: t("cv.budget.all"),
    dataset: null,
    version: null,
    link: null,
    window: null,
    cell: null,
    place: null,
    method: t("cv.hwgt.budgetMethod"),
    uncertainty: t("cv.hwgt.budgetUnc"),
    n: null,
    status: null,
    scripts: ["pipeline/stats/error_budget.py", "public/data/meta/error_budget.json", "pipeline/tests/test_error_budget.py"].map((s) => repoLink(s)),
    validation: rowLink(VALIDATION_TABLE, "measured errors"),
    patternOnly: null,
  };
}
