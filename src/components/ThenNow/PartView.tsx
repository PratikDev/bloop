"use client";

import type { ReactNode } from "react";
import { formatMonth, localDigits } from "@/lib/i18n";
import { heatNormalLabel, missingRuns, playheadYears, waterRows, windowLabel, yearlyBaseline, yearlyWindows, yearRows, type YearlyPart } from "@/lib/then-now";
import type { DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { HistoryChart, type ChartSpan } from "../charts/HistoryChart";
import { YearlyChart } from "../charts/YearlyChart";
import type { Part } from "./use-then-now-player";

function YearlyView({ part, demo, index, splitIndex, motionPaused }: { part: YearlyPart; demo: DhakaThenNowDemo; index: number | null; splitIndex: number | null; motionPaused: boolean }) {
  const { state } = useAppState();
  const t = useT();
  const pair = yearlyWindows(demo, part);
  const [thenYear, nowYear] = playheadYears(pair, index, splitIndex);
  // Nothing sounding: every stripe is drawn. Sounding in one window: the earlier window is all played, the later not yet.
  const playing = index !== null || splitIndex !== null;
  const single = splitIndex === null ? thenYear : undefined;
  const playedThrough = !playing
    ? { then: null, now: null }
    : single !== undefined
      ? { then: single, now: single }
      : { then: thenYear ?? null, now: nowYear ?? null };
  const unit = t(part === "heat" ? "thenNow.unit.anomaly" : "thenNow.unit.mmPerDay");
  return (
    <YearlyChart
      rows={yearRows(pair)}
      pair={pair}
      labels={{ then: t("thenNow.then", { label: windowLabel(pair.A) }), now: t("thenNow.now", { label: windowLabel(pair.B) }) }}
      unit={unit}
      zeroLine={part === "heat" ? heatNormalLabel(t) : undefined}
      stripes={
        part === "heat"
          ? { above: t("thenNow.stripes.heatAbove"), below: t("thenNow.stripes.heatBelow") }
          : { above: t("thenNow.stripes.monsoonAbove", { window: localDigits(windowLabel(pair.A), state.lang) }), below: t("thenNow.stripes.monsoonBelow") }
      }
      motion={{
        part,
        baseline: yearlyBaseline(part, pair),
        playedThrough,
        sounding: single ?? null,
        splitYear: splitIndex === null ? { then: null, now: null } : { then: thenYear ?? null, now: nowYear ?? null },
        paused: motionPaused,
      }}
      summary={t("thenNow.summary.yearly", {
        part: t(part === "heat" ? "thenNow.part.heat" : "thenNow.part.monsoon"),
        unit,
        thenLabel: windowLabel(pair.A),
        thenMean: pair.A.mean,
        nowLabel: windowLabel(pair.B),
        nowMean: pair.B.mean,
      })}
    />
  );
}

function WaterView({ grace, index }: { grace: GraceContextFile; index: number | null }) {
  const { state } = useAppState();
  const t = useT();
  const bd = grace.boxes.Bangladesh;
  const at = (month: string) => bd.months.indexOf(month);
  const [a0, a1] = bd.window_A.split("..");
  const [b0, b1] = bd.window_B.split("..");
  const spans: ChartSpan[] = [
    { from: at(a0), to: at(a1), kind: "window" },
    { from: at(b0), to: at(b1), kind: "window" },
    ...missingRuns(bd.cm).map(([from, to]) => ({ from: from - 0.5, to: to + 0.5, kind: "gap" as const })),
  ];
  return (
    <>
      <HistoryChart
        rows={waterRows(grace).map((r) => ({ i: r.i, month: r.month, bangladesh: r.bangladesh, nwIndia: r.nwIndia }))}
        series={[
          { key: "bangladesh", label: t("thenNow.water.played"), tone: "now" },
          { key: "nwIndia", label: t("thenNow.water.notPlayed"), tone: "then" },
        ]}
        spans={spans}
        unit={t("thenNow.unit.cm")}
        playheadIndex={index}
        summary={t("thenNow.water.summary", {
          missing: bd.missing_months,
          from: formatMonth(bd.months[0], state.lang),
          to: formatMonth(bd.months[bd.months.length - 1], state.lang),
        })}
      />
      <p className="text-small text-haze">{t("thenNow.water.shading")}</p>
    </>
  );
}

/** A finding's headline: its sentence, then (smaller, after it) where the numbers come from. */
export function Headline({ caption, source }: { caption: string; source?: string }) {
  return (
    <p className="text-lead leading-snug text-moon md:text-title lg:short:text-lead">
      {caption}
      {source && <span className="ms-2 text-small text-haze">{source}</span>}
    </p>
  );
}

/** The heat finding in plain words, from the data's own numbers: "Dhaka in April–May: 1.37 °C warmer in 2016–2025 than in 1981–1990". */
function HeatHeadline({ place, heat }: { place: string; heat: DhakaThenNowDemo["heat"] }) {
  const t = useT();
  const change = heat.change_C;
  const sentence = t(change < 0 ? "thenNow.heat.cooler" : "thenNow.heat.warmer", {
    place,
    change: Math.abs(change),
    now: windowLabel(heat.B),
    then: windowLabel(heat.A),
  });
  return <Headline caption={sentence} source={t("thenNow.heat.source")} />;
}

/** One sounded part: its caption as the headline, any `note` the chart needs read first, then the chart with its playhead. */
export function PartView({ part, place, demo, grace, index, splitIndex, motionPaused = false, note }: { part: Part; place: string; demo: DhakaThenNowDemo; grace: GraceContextFile; index: number | null; splitIndex: number | null; motionPaused?: boolean; note?: ReactNode }) {
  const t = useT();
  const caption = part === "monsoon" ? demo.rain.caption : demo.water.caption;
  return (
    <>
      {/* Heat is written from the numbers; rain and water show the caption exactly as the JSON gives it (translated in Bangla). */}
      {part === "heat" ? <HeatHeadline place={place} heat={demo.heat} /> : <Headline caption={t("data.text", { text: caption })} />}
      {note}
      {part === "water" ? <WaterView grace={grace} index={index} /> : <YearlyView part={part} demo={demo} index={index} splitIndex={splitIndex} motionPaused={motionPaused} />}
    </>
  );
}
