"use client";

import type { ReactNode } from "react";
import { formatSigned } from "@/lib/i18n";
import { windowLabel } from "@/lib/then-now";
import type { DemoWindow, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import type { Part } from "./use-then-now-player";

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[12rem_1fr]">
      <dt className="text-haze">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * The disclosure on every comparison (plan B1, QA §13): datasets, windows, and
 * the numbers behind the caption, all from the JSON. Shown inside a Fold.
 */
export function Disclosure({ part, demo, grace }: { part: Part; demo: DhakaThenNowDemo; grace: GraceContextFile }) {
  const { state } = useAppState();
  const t = useT();
  const unit = part === "heat" ? "°C" : "mm/day";
  const windows = (w: { A: DemoWindow; B: DemoWindow }) =>
    (["A", "B"] as const).map((k) => (
      <Row key={k} label={t("disclosure.window", { label: windowLabel(w[k]), years: w[k].n_years })}>
        {t("disclosure.mean", { value: w[k].mean, unit })}; {t("disclosure.spread", { value: w[k].spread, unit })}
      </Row>
    ));

  return (
    <dl className="space-y-2">
      {part === "heat" && (
        <>
          <Row label={t("disclosure.dataset")}>{demo.heat.dataset}</Row>
          {windows(demo.heat)}
          <Row label="">{t("disclosure.change", { value: `${formatSigned(demo.heat.change_C, state.lang, 2)} °C` })}</Row>
        </>
      )}
      {part === "monsoon" && (
        <>
          <Row label={t("disclosure.dataset")}>{demo.rain.gpcp.dataset}</Row>
          {windows(demo.rain.gpcp)}
          <Row label="">{t("disclosure.change", { value: `${formatSigned(demo.rain.gpcp.change_pct, state.lang, 0)}%` })}</Row>
          <Row label={t("disclosure.crossCheck")}>{demo.rain.gpcc.dataset}</Row>
          {windows(demo.rain.gpcc)}
          <Row label="">{t("disclosure.change", { value: `${formatSigned(demo.rain.gpcc.change_pct, state.lang, 0)}%` })}</Row>
        </>
      )}
      {part === "water" && (
        <>
          <Row label={t("disclosure.dataset")}>{demo.water.dataset}</Row>
          {(["Bangladesh", "NW_India"] as const).map((box) => {
            const b = demo.water[box];
            return (
              <Row key={box} label={box === "Bangladesh" ? t("thenNow.water.played") : t("thenNow.water.notPlayed")}>
                {t("disclosure.box", {
                  name: box.replace("_", " "),
                  a: b.mean_A,
                  b: b.mean_B,
                  windowA: b.window_A,
                  windowB: b.window_B,
                  trend: b.trend_cm_per_yr,
                })}
              </Row>
            );
          })}
          <Row label={t("disclosure.gapNote")}>{grace.gap_note}</Row>
        </>
      )}
    </dl>
  );
}
