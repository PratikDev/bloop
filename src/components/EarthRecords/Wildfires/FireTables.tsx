"use client";

import { Button } from "@/components/ui/button";
import { fwiClassText, satText } from "@/lib/earth/fire-text";
import { dayCount, seriesOf } from "@/lib/earth/firms";
import { pilotProvenance } from "@/lib/earth/pilot-provenance";
import { formatDay, formatFixed, formatInteger } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { DataTable } from "../../EarthData/DataTable";
import { HowWeGotThis } from "../../HowWeGotThis";
import { WRAP_KEY } from "../../row-key";
import type { WildfiresState } from "./use-wildfires";

const FRP_DECIMALS = 1;
const RHO_DECIMALS = 2;

/** View as table: the box's FIRMS counts per day for every sensor, and the chosen sensor's FRP sum. */
export function FiresTable({ w }: { w: WildfiresState }) {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  if (!w.daily || !w.source) return null;
  const daily = w.daily;
  const n = (v: number | null | undefined) => (v === null || v === undefined ? t("hwgt.na") : formatInteger(v, lang));
  const chosen = seriesOf(daily, w.region, w.source);
  return (
    <DataTable
      testId="firms-table"
      className="max-h-72"
      caption={t("earth.fire.table.caption", { box: t("data.text", { text: w.region }) })}
      columns={[t("earth.fire.table.day"), ...daily.sources.map((s) => satText(daily, s)), t("earth.fire.table.frp", { sat: satText(daily, w.source) })]}
      rowKeys={w.days}
      current={w.days.indexOf(w.day ?? "")}
      currentLabel={t("earth.fire.day")}
      rows={w.days.map((d) => {
        const frp = chosen ? dayCount(chosen, d) : null;
        return [
          formatDay(d, lang),
          ...daily.sources.map((s) => {
            const series = seriesOf(daily, w.region, s);
            return n(series ? dayCount(series, d)?.count : null);
          }),
          frp ? formatFixed(frp.frpSumMW, lang, FRP_DECIMALS) : t("hwgt.na"),
        ];
      })}
    />
  );
}

/** Forecast meets outcome: the pilot table (class vs the next day's FIRMS count) and Spearman rho with n per sensor. */
export function PilotTable({ w }: { w: WildfiresState }) {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  if (!w.daily || !w.data) return null;
  const daily = w.daily;
  const meta = w.data.fwi.meta;
  return (
    <section className="space-y-2" aria-labelledby="pilot-heading" data-testid="pilot" data-provenance-group="">
      <h3 id="pilot-heading" className="text-body font-medium">
        {t("earth.pilot.heading")}
      </h3>
      <p className="text-small text-haze">{t("earth.pilot.lead")}</p>
      {!w.pilot ? (
        <Button variant="outline" className={WRAP_KEY} onClick={() => void w.loadArchive()}>
          {t("earth.pilot.open")}
        </Button>
      ) : (
        <>
          <DataTable
            testId="pilot-table"
            className="max-h-72"
            caption={t("earth.pilot.heading")}
            columns={[t("earth.pilot.col.box"), t("earth.pilot.col.issued"), t("earth.pilot.col.forDay"), t("earth.pilot.col.class"), ...daily.sources.map((s) => satText(daily, s))]}
            rows={w.pilot.rows.map((r) => [
              t("data.text", { text: r.region }),
              formatDay(r.issued, lang),
              formatDay(r.forDay, lang),
              r.fwiClass === null ? t("hwgt.na") : fwiClassText(t, meta, r.fwiClass),
              ...daily.sources.map((s) => {
                const c = r.counts[s];
                return typeof c === "number" ? formatInteger(c, lang) : t("hwgt.na");
              }),
            ])}
          />
          <ul className="space-y-1 text-small" data-testid="pilot-rho">
            {w.summary.map((s) => (
              <li key={s.source} data-n={s.n} data-rho={s.rho ?? ""}>
                {s.rho === null
                  ? t("earth.pilot.rhoNone", { sat: satText(daily, s.source), n: formatInteger(s.n, lang) })
                  : t("earth.pilot.rho", { sat: satText(daily, s.source), rho: formatFixed(s.rho, lang, RHO_DECIMALS), n: formatInteger(s.n, lang) })}{" "}
                {t(s.claim === "agreement" ? "earth.pilot.claim" : "earth.pilot.noClaim")}
              </li>
            ))}
          </ul>
          <HowWeGotThis facts={[pilotProvenance(t, lang, w.pilot.rows.length)]} />
        </>
      )}
    </section>
  );
}
