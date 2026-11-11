"use client";

import { Fragment } from "react";
import { formatFixed, formatInteger, formatSigned, formatYear, type BoundT, type Lang } from "@/lib/i18n";
import { longLine, partStats, pText, type StatPart } from "@/lib/then-now-stats";
import type { ClimateCellName } from "@/types/data-contract";
import type { StatComparison, StatTrend, ThenNowStatsFile } from "@/types/then-now-stats";
import { useAppState, useT } from "../AppState/use-app-state";
import { Row } from "./Disclosure";

export function StatsLine({ stats, city, part }: { stats: ThenNowStatsFile; city: ClimateCellName; part: StatPart }) {
  const { state } = useAppState();
  const t = useT();
  return (
    <p data-testid="stat-line" data-verdict={partStats(stats, city, part).verdict} className="text-small text-moon">
      {longLine(t, state.lang, partStats(stats, city, part))}
    </p>
  );
}

const testsText = (t: BoundT, lang: Lang, c: StatComparison) =>
  t("stats.tests", { welch: pText(lang, c.p_welch), mw: pText(lang, c.p_mann_whitney), a: formatInteger(c.A.n, lang), b: formatInteger(c.B.n, lang) });

function trendText(t: BoundT, lang: Lang, tr: StatTrend, perDecade: boolean) {
  const k = perDecade ? 10 : 1;
  const unit = t(perDecade ? "stats.unit.perDecade" : "stats.unit.cmPerYear");
  return t("stats.trend", {
    test: tr.test,
    from: formatYear(Math.floor(tr.years[0]), lang),
    to: formatYear(Math.floor(tr.years[1]), lang),
    slope: formatSigned(tr.sen_slope * k, lang, 3),
    lo: formatSigned(tr.sen_slope_ci[0] * k, lang, 3),
    hi: formatSigned(tr.sen_slope_ci[1] * k, lang, 3),
    unit,
    p: pText(lang, tr.p),
  });
}

export function StatsDetails({ stats, city, part }: { stats: ThenNowStatsFile; city: ClimateCellName; part: StatPart }) {
  const { state } = useAppState();
  const t = useT();
  const lang = state.lang;
  const c = stats.cities[city];
  const water = stats.water.Bangladesh;
  const draws = formatInteger(stats.method.bootstrap_draws, lang);
  const comparisons: [string, StatComparison][] =
    part === "heat" ? [["", c.heat]] : part === "monsoon" ? [["GPCP", c.rain.gpcp], ["GPCC", c.rain.gpcc]] : [["", water.windows]];
  return (
    <section aria-labelledby="stats-title" className="space-y-2" data-testid="stats-details">
      <h3 id="stats-title" className="font-medium text-moon">
        {t("stats.title")}
      </h3>
      <dl className="space-y-2">
        <Row label={t("stats.row.result")}>{longLine(t, lang, partStats(stats, city, part))}</Row>
        {comparisons.map(([label, cmp]) => (
          <Row key={label || "one"} label={label ? `${t("stats.row.tests")}, ${label}` : t("stats.row.tests")}>
            {testsText(t, lang, cmp)}
          </Row>
        ))}
        <Row label={t("stats.row.method")}>{part === "water" ? t("stats.method.trend") : t("stats.method.decades", { draws })}</Row>
        {part === "heat" && <Row label={t("stats.row.trend")}>{trendText(t, lang, c.heat.trend, true)}</Row>}
        {part === "water" && (
          <>
            <Row label={t("stats.row.trend")}>{trendText(t, lang, water.trend, false)}</Row>
            {water.uncertainty_1sigma_cm && (
              <Row label={t("stats.row.measurement")}>
                {t("stats.grace", {
                  median: formatFixed(water.uncertainty_1sigma_cm.median, lang, 1),
                  min: formatFixed(water.uncertainty_1sigma_cm.min, lang, 1),
                  max: formatFixed(water.uncertainty_1sigma_cm.max, lang, 1),
                })}
              </Row>
            )}
          </>
        )}
        {part === "monsoon" &&
          (["gpcp", "gpcc"] as const).map((src) => (
            <Fragment key={src}>
              {(["jjas_total_mm", "annual_total_mm"] as const).map((k) => {
                const x = c.rain[src][k];
                return (
                  <Row key={k} label={`${t("stats.row.alsoChecked")}, ${src.toUpperCase()}`}>
                    {t("stats.totals", {
                      which: t(k === "jjas_total_mm" ? "stats.totals.jjas" : "stats.totals.annual"),
                      value: `${formatSigned(x.change_pct, lang, 0)}% (95% CI ${formatSigned(x.change_pct_ci[0], lang, 1)}% – ${formatSigned(x.change_pct_ci[1], lang, 1)}%)`,
                      welch: pText(lang, x.p_welch),
                      mw: pText(lang, x.p_mann_whitney),
                    })}
                  </Row>
                );
              })}
            </Fragment>
          ))}
      </dl>
    </section>
  );
}
