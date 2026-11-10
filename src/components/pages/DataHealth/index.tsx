"use client";

import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { healthRows, loadHealth } from "@/lib/earth/health";
import { FLAGS } from "@/lib/flags";
import { formatFixed, formatInteger, formatUtc } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PAGE_PATHS } from "@/router/modes";
import { useAppState, useT } from "../../AppState/use-app-state";
import { DataTable } from "../../EarthData/DataTable";
import { StatusBadge } from "../../StatusBadge";
import { NotFoundPage } from "../NotFound";

const LAG_DECIMALS = 1;

/**
 * Data health (P1): one row per record and product from meta/health.json (the pipeline's health run): its newest data,
 * the source's newest, the lag, and the checks passed and failed. Linked from How we know. Off unless its flag.
 */
export function DataHealthPage() {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  const { value: file, error } = useLoaded(loadHealth, FLAGS.dataHealth);
  if (!FLAGS.dataHealth) return <NotFoundPage />;
  const rows = file ? healthRows(file) : [];
  const time = (iso: string | null) => (iso ? formatUtc(iso, lang) : t("hwgt.na"));
  return (
    <section aria-labelledby="health-title" className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 overflow-y-auto px-4 pt-3 pb-6 md:px-8">
      <header className="space-y-1">
        <h1 id="health-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
          {t("earth.health.title")}
        </h1>
        <p className="max-w-3xl text-body text-haze">{t("earth.health.lead")}</p>
        <p className="max-w-3xl text-small text-haze">{t("earth.health.keys")}</p>
      </header>
      {error && <StatusBadge kind="error">{t("earth.health.error")}</StatusBadge>}
      {!file && !error && <StatusBadge kind="loading">{t("earth.health.loading")}</StatusBadge>}
      {file && (
        <DataTable
          testId="health-table"
          className="max-h-[70dvh]"
          caption={t("earth.health.caption", { n: formatInteger(rows.length, lang), date: formatUtc(file.generated_utc, lang) })}
          columns={[
            t("earth.health.col.record"),
            t("earth.health.col.category"),
            t("earth.health.col.lastData"),
            t("earth.health.col.sourceLatest"),
            t("earth.health.col.lag"),
            t("earth.health.col.checks"),
          ]}
          rowKeys={rows.map((r) => r.id)}
          rows={rows.map((r) => [
            <span key="n" lang="en" data-health-row={r.id}>
              {r.title}
            </span>,
            r.category,
            time(r.lastData),
            time(r.sourceLatest),
            r.lagDays === null ? t("hwgt.na") : t("earth.health.lagDays", { days: formatFixed(r.lagDays, lang, LAG_DECIMALS) }),
            t("earth.health.passFail", { passed: formatInteger(r.passed, lang), failed: formatInteger(r.failed, lang) }),
          ])}
        />
      )}
      <Link to={PAGE_PATHS.how} className={cn(buttonVariants({ variant: "ghost" }), "h-11 self-start rounded-full px-4 text-body text-haze ring-1 ring-glass-edge")}>
        {t("earth.health.back")}
      </Link>
    </section>
  );
}
