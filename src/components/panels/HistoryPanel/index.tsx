"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayhead } from "@/hooks/use-playhead";
import { decadeRange, fullDecades, monthlySeries, PLACES, sharedCells, type HistoryMetric } from "@/lib/history";
import { formatFixed, formatMonth, formatSigned } from "@/lib/i18n";
import { heatNormalLabel } from "@/lib/then-now";
import type { ClimateCellName } from "@/types/data-contract";
import { useAppState, useT } from "../../AppState/use-app-state";
import { HistoryChart } from "../../charts/HistoryChart";
import { ChoiceGroup } from "../../ChoiceGroup";
import { StatusBadge } from "../../StatusBadge";
import { useHistoryData } from "./use-history-data";
import { HISTORY_PLAYER, useHistoryPlayers } from "./use-history-players";

const DECADES_SHOWN = 4;

/**
 * Place History (plan H1, H3): one place's monthly heat or rain record, with a
 * decade played month by month and a playhead on the chart. Dragging along the
 * chart (or its arrow keys) plays the month under the pointer.
 */
export function HistoryPanel() {
  const { state } = useAppState();
  const t = useT();
  const data = useHistoryData();
  const [place, setPlace] = useState<ClimateCellName>("Chattogram");
  const [metric, setMetric] = useState<HistoryMetric>("heat");
  const [decadeChoice, setDecadeChoice] = useState<number | null>(null);
  const players = useHistoryPlayers();
  const head = usePlayhead(HISTORY_PLAYER);

  // Changing what is selected stops what is playing, so sound and chart never disagree.
  const choose =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      players.stop();
      set(value);
    };

  if (data.status === "loading") return <StatusBadge kind="loading">{t("history.loading")}</StatusBadge>;
  if (data.status === "error") return <StatusBadge kind="error">{t("history.error")}</StatusBadge>;

  const series = monthlySeries(metric, place, data);
  const decades = fullDecades(series.months).slice(0, DECADES_SHOWN);
  const decade = decadeChoice !== null && decades.includes(decadeChoice) ? decadeChoice : decades[0];
  const [start, end] = decadeRange(series.months, decade);
  const shared = sharedCells(metric, place, data);
  const unit = t(metric === "heat" ? "history.unit.heat" : "history.unit.rain");
  const dataset = metric === "heat" ? data.gistemp.dataset : data.gpcp.dataset;
  const caveat = metric === "rain" ? data.gpcp.caveat : undefined;
  const placeName = (p: ClimateCellName) => t(`place.${p}`);

  const voice = metric === "heat" ? "heat" : "monsoon";
  const monthText = (i: number) =>
    t("history.monthValue", {
      month: formatMonth(series.months[i], state.lang),
      value: metric === "heat" ? formatSigned(series.values[i], state.lang, 2) : formatFixed(series.values[i], state.lang, 1),
      unit,
    });

  // One month, through the same voice as the decade (silent with sound off; the slider still announces it).
  const playMonth = (i: number) =>
    players.playMonth(i, state.soundOn ? { label: monthText(i), values: [series.values[i]], voice } : null);

  const play = () =>
    players.playDecade({ label: `${placeName(place)}, ${t("history.decadeLabel", { decade })}`, values: series.values.slice(start, end), voice }, start);

  return (
    <div className="space-y-4">
      <p className="text-haze">{t("history.intro")}</p>
      <div className="space-y-3">
        <ChoiceGroup<ClimateCellName> label={t("history.place")} value={place} onChange={choose(setPlace)} options={PLACES.map((p) => ({ value: p, label: placeName(p) }))} className="flex-wrap" />
        <ChoiceGroup<HistoryMetric>
          label={t("history.metric")}
          value={metric}
          onChange={choose(setMetric)}
          options={[
            { value: "heat", label: t("history.heat") },
            { value: "rain", label: t("history.rain") },
          ]}
        />
        <ChoiceGroup<string>
          label={t("history.decade")}
          value={String(decade)}
          onChange={choose((d: string) => setDecadeChoice(Number(d)))}
          options={decades.map((d) => ({ value: String(d), label: t("history.decadeLabel", { decade: d }) }))}
          className="flex-wrap"
        />
      </div>

      <HistoryChart
        rows={series.months.map((month, i) => ({ i, month, value: series.values[i] }))}
        series={[{ key: "value", label: `${placeName(place)}: ${dataset}`, tone: "now" }]}
        spans={[{ from: start, to: end - 1, kind: "selected" }]}
        unit={unit}
        zeroLine={metric === "heat" ? heatNormalLabel() : undefined}
        playheadIndex={head && players.playingFrom !== null ? players.playingFrom + head.index : players.monthIndex}
        scrub={{ value: players.monthIndex, label: t("history.scrub", { place: placeName(place) }), valueText: monthText, onChange: playMonth }}
        summary={t("history.summary", {
          metric: t(metric === "heat" ? "history.heat" : "history.rain"),
          place: placeName(place),
          from: formatMonth(series.months[0], state.lang),
          to: formatMonth(series.months[series.months.length - 1], state.lang),
        })}
        heightClass="h-52"
      />

      <Button disabled={!state.soundOn} onClick={play} className="h-11 gap-2 bg-tide px-4 text-body">
        <Play aria-hidden="true" />
        {t("history.play", { decade })}
      </Button>
      {!state.soundOn && <p className="text-small text-haze">{t("thenNow.soundOff")}</p>}

      <div className="space-y-1 text-small text-haze">
        <p>{t("history.cell", { lat: series.lat, lon: series.lon })}</p>
        {shared.length > 0 && <p className="text-moon">{t("history.sharedCell", { places: shared.map(placeName).join(", ") })}</p>}
        {caveat && <p>{caveat}</p>}
      </div>
    </div>
  );
}
