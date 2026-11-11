"use client";

import { Fragment, type ReactNode } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { healthOf, loadHealth } from "@/lib/earth/health";
import { formatFixed, formatInteger, formatUtc, type MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";

const LAG_DECIMALS = 1;

/**
 * "Is this data fresh?": a record's row of meta/health.json in its How we got this panel: the newest data shipped
 * and at the source, the lag between them, the checks passed and failed, and when the health run was. A missing time
 * says "not available", never a guess; no local path is ever shown (src/lib/earth/health.ts).
 */
export function FreshFacts({ id }: { id: string }) {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  const { value: file, status } = useLoaded(loadHealth);
  const na = <span className="text-haze">{t("hwgt.na")}</span>;
  if (status === "loading") return <p className="text-small text-haze">{t("earth.fresh.loading")}</p>;
  const h = file ? healthOf(file, id) : null;
  return (
    <section className="space-y-1.5 border-t border-tide pt-3" data-testid="fresh-facts" data-health-id={id}>
      <h3 className="text-lead font-medium text-moon">{t("earth.fresh.heading")}</h3>
      {!h ? (
        <p className="text-body text-haze">{t("earth.fresh.none")}</p>
      ) : (
        <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-1.5 text-body">
          {(
            [
              ["earth.fresh.lastData", h.lastData ? formatUtc(h.lastData, lang) : na, "last"],
              ["earth.fresh.sourceLatest", h.sourceLatest ? formatUtc(h.sourceLatest, lang) : na, "source"],
              ["earth.fresh.lag", h.lagDays === null ? na : t("earth.fresh.lagValue", { days: formatFixed(h.lagDays, lang, LAG_DECIMALS) }), "lag"],
              [
                "earth.fresh.checks",
                <span key="c" className="flex flex-col">
                  {t("earth.fresh.checksValue", { passed: formatInteger(h.passed, lang), failed: formatInteger(h.failed, lang) })}
                  {h.failedChecks.length > 0 && <span className="text-small text-haze">{t("earth.fresh.failed", { checks: h.failedChecks.join("; ") })}</span>}
                </span>,
                "checks",
              ],
              ["earth.fresh.run", formatUtc(h.runUtc, lang), "run"],
            ] as const satisfies readonly (readonly [MessageKey, ReactNode, string])[]
          ).map(([key, value, field]) => (
            <Fragment key={key}>
              <dt className="text-haze">{t(key)}</dt>
              <dd data-fresh={field}>{value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </section>
  );
}
