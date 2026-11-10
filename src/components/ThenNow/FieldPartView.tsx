"use client";

import { useState, type ReactNode } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { loadFirms, loadNdvi, NDVI_POINTS } from "@/lib/data";
import { FIRE_REGIONS, firesPair, pairRows, vegetationPair, type SeriesPair } from "@/lib/field-records";
import { formatDayMonth, formatFixed, formatMonth, localDigits } from "@/lib/i18n";
import type { FirmsRegion, NdviPointName } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { PairChart } from "../charts/PairChart";
import { ChoiceGroup } from "../ChoiceGroup";
import { StatusBadge } from "../StatusBadge";
import { Row } from "./Disclosure";
import { PartLayout } from "./Layout";
import { SeriesTable } from "./SeriesTable";
import { Headline } from "./PartView";

export type FieldPart = "fires" | "vegetation";

/** Fires and vegetation in the shared layout: finding left; place and "no sound yet" right; sources folded. */
function FieldLayout({ part, decimals, picker, pair, chart, caption, facts, stage }: { stage: ReactNode; part: FieldPart; decimals: number; picker: ReactNode; pair: SeriesPair; chart: Omit<FieldChartProps, "pair">; caption: string; facts: ReactNode }) {
  const { state } = useAppState();
  const t = useT();
  const value = (v: number | null) => (v === null ? null : formatFixed(v, state.lang, decimals));
  return (
    <PartLayout
      stage={stage}
      finding={
        <>
          <Headline caption={caption} />
          <FieldChart pair={pair} {...chart} />
        </>
      }
      sideTitle={t("field.place")}
      side={
        <>
          {picker}
          {/* No voice yet for these records (L2's optional list): said, never faked. */}
          <StatusBadge kind="october">{t("field.soundOctober")}</StatusBadge>
        </>
      }
      detailsTitle={t("field.sources")}
      details={
        <>
          <dl className="space-y-2">{facts}</dl>
          <SeriesTable
            caption={t("table.caption", { part: t(`thenNow.part.${part}`) })}
            headers={[t("table.period"), pair.then.label, pair.now.label]}
            rows={pairRows(pair).map((r) => [chart.tick(r.i), value(r.then), value(r.now)])}
          />
        </>
      }
    />
  );
}

interface FieldChartProps {
  pair: SeriesPair;
  unit: string;
  tick: (i: number) => string;
  summary: string;
}

function FieldChart({ pair, unit, tick, summary }: FieldChartProps) {
  const t = useT();
  return (
    <PairChart
      rows={pairRows(pair)}
      pair={pair}
      labels={{ then: t("thenNow.then", { label: pair.then.label }), now: t("thenNow.now", { label: pair.now.label }) }}
      unit={unit}
      tick={tick}
      summary={summary}
    />
  );
}

function Fires({ stage }: { stage: ReactNode }) {
  const { state } = useAppState();
  const t = useT();
  const { value: file, status } = useLoaded(loadFirms);
  const [region, setRegion] = useState<FirmsRegion>("CHT_Bangladesh_MarApr");
  if (status === "loading") return <StatusBadge kind="loading">{t("thenNow.loading")}</StatusBadge>;
  const pair = file ? firesPair(file, region) : null;
  if (!file || !pair) return <StatusBadge kind="error">{t("thenNow.error")}</StatusBadge>;
  const place = t(`field.fires.region.${region}`);
  return (
    <FieldLayout
      stage={stage}
      part="fires"
      decimals={0}
      picker={<ChoiceGroup<FirmsRegion> label={t("field.fires.region")} value={region} onChange={setRegion} options={FIRE_REGIONS.map((r) => ({ value: r, label: t(`field.fires.region.${r}`) }))} vertical />}
      pair={pair}
      chart={{
        unit: t("field.fires.unit"),
        tick: (i) => formatDayMonth(pair.dates.then[i] ?? "", state.lang),
        summary: t("field.fires.summary", { place, thenYear: pair.thenYear, nowYear: pair.nowYear }),
      }}
      caption={t("field.fires.caption", { place, thenYear: pair.thenYear, thenTotal: pair.thenTotal, nowYear: pair.nowYear, nowTotal: pair.nowTotal })}
      facts={
        <>
          <Row label={t("disclosure.dataset")}>{file.dataset}</Row>
          <Row label={t("field.rule")}>{t("data.text", { text: file.rule })}</Row>
          <Row label={t("field.credit")}>{file.credit}</Row>
        </>
      }
    />
  );
}

function Vegetation({ stage }: { stage: ReactNode }) {
  const { state } = useAppState();
  const t = useT();
  const { value: file, status } = useLoaded(loadNdvi);
  const [point, setPoint] = useState<NdviPointName>("Sundarbans");
  if (status === "loading") return <StatusBadge kind="loading">{t("thenNow.loading")}</StatusBadge>;
  if (!file) return <StatusBadge kind="error">{t("thenNow.error")}</StatusBadge>;
  const pair = vegetationPair(file, point);
  const place = t(`field.veg.point.${point}`);
  return (
    <FieldLayout
      stage={stage}
      part="vegetation"
      decimals={2}
      picker={<ChoiceGroup<NdviPointName> label={t("field.veg.point")} value={point} onChange={setPoint} options={NDVI_POINTS.map((p) => ({ value: p, label: t(`field.veg.point.${p}`) }))} vertical />}
      pair={pair}
      chart={{
        unit: t("field.veg.unit"),
        tick: (i) => `${formatMonth((pair.dates.then[i] ?? "").slice(0, 7), state.lang)}/${localDigits((pair.dates.now[i] ?? "").slice(2, 4), state.lang)}`,
        summary: t("field.veg.summary", { place, then: pair.then.label, now: pair.now.label, dataset: file.dataset }),
      }}
      caption={t("field.veg.caption", { place, then: pair.then.label, thenMean: pair.then.mean ?? 0, now: pair.now.label, nowMean: pair.now.mean ?? 0 })}
      facts={
        <>
          <Row label={t("disclosure.dataset")}>{file.dataset}</Row>
          <Row label={t("field.caveat")}>{t("data.text", { text: file.caveat })}</Row>
          <Row label={t("field.credit")}>{file.credit}</Row>
        </>
      }
    />
  );
}

/**
 * Two more then-vs-now records from L1 (contract §6, §7): fires (FIRMS, MODIS
 * example years) and vegetation (NDVI, single pixels). Shown with their data
 * rules; no sound yet. Not tied to the city: fixed places in the files.
 */
/** `stage` is the city globe: Fires and Vegetation have no sound, so it never pulses (and they have no year axis, so no stripes or year). */
export function FieldPartView({ part, stage }: { part: FieldPart; stage: ReactNode }) {
  return part === "fires" ? <Fires stage={stage} /> : <Vegetation stage={stage} />;
}
