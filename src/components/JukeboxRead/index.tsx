"use client";

import { useId, useState, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { brailleLabel } from "@/a11y/aria";
import { Button } from "@/components/ui/button";
import { BOX_IDS, NEEDLE_BOX } from "@/lib/cv/boxes";
import { budgetLines } from "@/lib/cv/budget-text";
import { budgetProvenance, readProvenance } from "@/lib/cv/provenance";
import { readShort, sigDecimals } from "@/lib/cv/read-short";
import type { ReadSource } from "@/lib/cv/read-source";
import { useCvView } from "@/hooks/use-cv-view";
import type { LatLon } from "@/lib/data";
import { formatFixed, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { Provenance } from "@/lib/provenance/types";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { HowWeGotThis, ProvenanceGroup } from "../HowWeGotThis";
import { STATUS_KEYS } from "../HowWeGotThis/Facts";
import { BudgetTable } from "./BudgetTable";
import { useBoxRead, type BoxRead } from "./use-box-read";

const num = (lang: Lang, v: number) => formatFixed(v, lang, sigDecimals(v));

function Rows({ t, lang, source, read }: { t: BoundT; lang: Lang; source: ReadSource; read: BoxRead }) {
  const { stats } = read;
  const unit = source.unit;
  const frame = source.timeLabel ?? (source.timeUtc ? formatUtc(source.timeUtc, lang) : t("hwgt.na"));
  const rows: [string, ReactNode][] = [
    [t("cv.read.record"), source.name],
    [t("cv.read.frame"), frame],
    [t("cv.read.box"), read.boxName],
  ];
  const values = source.trust !== "pattern" && stats && stats.p50 !== null && stats.p10 !== null && stats.p90 !== null;
  if (values) {
    rows.push(
      [t("cv.read.median"), t("cv.read.value", { value: num(lang, stats.p50 as number), unit })],
      [t("cv.read.spread"), t("cv.read.range", { lo: num(lang, stats.p10 as number), hi: num(lang, stats.p90 as number), unit })],
    );
  }
  if (stats && stats.nodataPct !== null) rows.push([t("cv.read.nodata"), t("cv.read.percent", { value: formatFixed(stats.nodataPct, lang, 1) })]);
  if (stats) rows.push([t("cv.read.cells"), formatFixed(stats.n, lang, 0)]);
  rows.push([t("cv.read.status"), t(STATUS_KEYS[source.status])]);
  return (
    <>
      <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-1 text-body">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-haze">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {source.trust === "pattern" && <p data-testid="read-pattern">{t("cv.read.pattern")}</p>}
      {source.trust !== "pattern" && !values && <p>{t("cv.read.empty")}</p>}
      {source.trust === "relative" && <p className="text-small text-haze">{t("cv.read.relative")}</p>}
    </>
  );
}

/**
 * "What the jukebox read from this frame" (CV/ML build, piece A): a collapsible panel with the box the values come
 * from (the needle's neighbourhood or a named box), the median, P10 to P90, % no data and n cells, the record's
 * validation status and its cents error budget. Pattern-only records show no numbers; relative ones no units. Plain
 * HTML: a heading with its toggle, keyboard reachable, its own "How we got this", and a braille-safe short line.
 */
export function JukeboxRead({ source, base, needle, loading, className, children }: {
  source: ReadSource | null;
  base: Provenance | null;
  needle: LatLon;
  loading?: boolean;
  className?: string;
  /** Extra controls under the numbers (the chord's toggle and line). */
  children?: ReactNode;
}) {
  const { state } = useAppState();
  const t = useT();
  const lang = state.lang;
  const [open, setOpen] = useState(false);
  const [view, setView] = useCvView();
  const panelId = useId();
  const headingId = useId();
  const read = useBoxRead(source, needle);
  const budget = source && source.trust !== "pattern" ? budgetLines(t, lang, read.budget, source.unit, read.pitch) : [];
  const short = source ? readShort(source, read.stats, read.budget) : "";
  const facts = source ? [readProvenance(t, lang, base, { name: read.boxName, bounds: read.bounds }, read.stats, budget.join(" "))] : [];
  return (
    <section aria-labelledby={headingId} data-testid="jukebox-read" className={cn("space-y-2", className)}>
      <h2 id={headingId} className="text-lead">
        <Button variant="outline" className="h-11 gap-2 rounded-full" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          <CaretDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
          {t("cv.read.title")}
        </Button>
      </h2>
      {open && (
        <div id={panelId} className="space-y-3 rounded-plate bg-dusk p-4 text-body ring-1 ring-glass-edge">
          <ChoiceGroup
            label={t("cv.read.box")}
            showLabel
            className="flex-wrap"
            value={view.box}
            onChange={(box) => setView({ box })}
            options={BOX_IDS.map((id) => ({ value: id, label: id === NEEDLE_BOX ? t("cv.box.needle") : t("cv.box.name", { id }) }))}
          />
          {!source ? (
            <p>{t(loading ? "cv.read.loading" : "cv.read.none")}</p>
          ) : (
            <ProvenanceGroup className="space-y-2">
              <Rows t={t} lang={lang} source={source} read={read} />
              {budget.length > 0 && (
                <div data-testid="read-budget" data-flag={read.budget?.flag ? "" : undefined}>
                  <h3 className="text-small text-haze">{t("cv.read.budget")}</h3>
                  {budget.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}
              <p className="text-small text-haze">
                {t("cv.read.short")}:{" "}
                <span lang="en" data-testid="read-short" className="font-mono text-moon" {...brailleLabel(short)}>
                  {short}
                </span>
              </p>
              <HowWeGotThis facts={facts} />
            </ProvenanceGroup>
          )}
          {children}
          <details className="space-y-2">
            <summary className="min-h-11 cursor-pointer py-2">{t("cv.budget.all")}</summary>
            <ProvenanceGroup className="space-y-2">
              <BudgetTable />
              <HowWeGotThis facts={[budgetProvenance(t)]} />
            </ProvenanceGroup>
          </details>
        </div>
      )}
    </section>
  );
}
