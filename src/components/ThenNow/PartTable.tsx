"use client";

import { formatFixed, formatMonth, formatYear } from "@/lib/i18n";
import { waterRows, yearlyWindows, yearRows } from "@/lib/then-now";
import type { DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { SeriesTable } from "./SeriesTable";
import type { Part } from "./use-then-now-player";

const DECIMALS = 2;

/** One sounded part's chart, as a table: built from the same rows the chart draws. */
export function PartTable({ part, demo, grace }: { part: Part; demo: DhakaThenNowDemo; grace: GraceContextFile }) {
  const { state } = useAppState();
  const t = useT();
  const number = (v: number | null) => (v === null ? null : formatFixed(v, state.lang, DECIMALS));
  const caption = t("table.caption", { part: t(`thenNow.part.${part}`) });

  if (part === "water") {
    return (
      <SeriesTable
        caption={caption}
        headers={[t("table.month"), `${t("thenNow.water.played")} (${t("thenNow.unit.cm")})`, `${t("thenNow.water.notPlayed")} (${t("thenNow.unit.cm")})`]}
        rows={waterRows(grace).map((r) => [formatMonth(r.month, state.lang), number(r.bangladesh), number(r.nwIndia)])}
      />
    );
  }

  const unit = t(part === "heat" ? "thenNow.unit.anomaly" : "thenNow.unit.mmPerDay");
  return (
    <SeriesTable
      caption={caption}
      headers={[t("table.year"), `${t("table.value")} (${unit})`]}
      rows={yearRows(yearlyWindows(demo, part)).map((r) => [formatYear(r.year, state.lang), number(r.then ?? r.now)])}
    />
  );
}
