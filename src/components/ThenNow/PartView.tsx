"use client";

import { formatMonth } from "@/lib/i18n";
import { heatNormalLabel, missingRuns, waterRows, windowLabel, yearlyWindows, yearRows, type YearlyPart } from "@/lib/then-now";
import type { DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { HistoryChart, type ChartSpan } from "../charts/HistoryChart";
import { YearlyChart } from "../charts/YearlyChart";
import { StatusBadge } from "../StatusBadge";
import type { Part } from "./use-then-now-player";

function YearlyView({ part, demo, index, splitIndex }: { part: YearlyPart; demo: DhakaThenNowDemo; index: number | null; splitIndex: number | null }) {
  const t = useT();
  const pair = yearlyWindows(demo, part);
  const years = [...pair.A.years, ...pair.B.years];
  const playheadYears =
    splitIndex !== null ? [pair.A.years[splitIndex], pair.B.years[splitIndex]].filter((y) => y !== undefined) : index !== null && years[index] !== undefined ? [years[index]] : [];
  const unit = t(part === "heat" ? "thenNow.unit.anomaly" : "thenNow.unit.mmPerDay");
  return (
    <YearlyChart
      rows={yearRows(pair)}
      pair={pair}
      labels={{ then: t("thenNow.then", { label: windowLabel(pair.A) }), now: t("thenNow.now", { label: windowLabel(pair.B) }) }}
      unit={unit}
      zeroLine={part === "heat" ? heatNormalLabel(t) : undefined}
      playheadYears={playheadYears}
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

/** A finding's headline: its caption, marked pending until the team approves the wording. */
export function Headline({ caption, pending = true }: { caption: string; pending?: boolean }) {
  const t = useT();
  return (
    <div className="space-y-2">
      <p className="font-serif text-lead leading-snug text-moon md:text-title lg:short:text-lead">{caption}</p>
      {pending && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>
          <span className="text-small text-haze">{t("disclosure.pending")}</span>
        </div>
      )}
    </div>
  );
}

/** One sounded part: its caption as the headline, then the chart with its playhead. */
export function PartView({ part, demo, grace, index, splitIndex }: { part: Part; demo: DhakaThenNowDemo; grace: GraceContextFile; index: number | null; splitIndex: number | null }) {
  const t = useT();
  const caption = part === "heat" ? demo.heat.caption : part === "monsoon" ? demo.rain.caption : demo.water.caption;
  return (
    <>
      {/* The caption exactly as the JSON gives it (translated in Bangla). */}
      <Headline caption={t("data.text", { text: caption })} />
      {part === "water" ? <WaterView grace={grace} index={index} /> : <YearlyView part={part} demo={demo} index={index} splitIndex={splitIndex} />}
    </>
  );
}
