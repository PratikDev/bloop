"use client";

import { useState } from "react";
import { Play } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { usePlayhead } from "@/hooks/use-playhead";
import { loadGlobalLayer } from "@/lib/data";
import { decadeRange, fullDecades, HISTORY_METRICS, HISTORY_VOICE, isBangladesh, placeSeries, type HistoryMetric } from "@/lib/history";
import { formatFixed, formatMonth, formatSigned } from "@/lib/i18n";
import { heatNormalLabel, missingRuns } from "@/lib/then-now";
import type { GlobalLayerName } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { HistoryChart, type ChartSpan, type ScrubMotion } from "../charts/HistoryChart";
import { ChoiceGroup } from "../ChoiceGroup";
import { StatusBadge } from "../StatusBadge";
import { PlacePicker } from "./PlacePicker";
import { RecordNotes } from "./RecordNotes";
import { useHistoryData } from "./use-history-data";
import { HISTORY_PLAYER, useHistoryPlayers } from "./use-history-players";

const DECADES_SHOWN = 4;
// One stable loader per layer (useLoaded needs a stable function).
const LAYER_LOADERS: Record<GlobalLayerName, () => ReturnType<typeof loadGlobalLayer>> = {
  heat: () => loadGlobalLayer("heat"),
  rain: () => loadGlobalLayer("rain"),
  water: () => loadGlobalLayer("water"),
};

export const DEFAULT_PLACE = "Chattogram";

/**
 * Month by month (Place History, plan H1, H3): one place's monthly heat, rain
 * or water record, a decade played month by month with a playhead, and
 * dragging along the chart (or its arrow keys) to hear one month. Bangladesh's
 * cities and L1's world places. The place and the record live in the URL (the page passes them in).
 */
export function MonthByMonth({
  place: requested,
  metric,
  onPlace,
  onMetric,
}: {
  place: string;
  metric: HistoryMetric;
  onPlace: (place: string) => void;
  onMetric: (metric: HistoryMetric) => void;
}) {
  const { state } = useAppState();
  const t = useT();
  const data = useHistoryData();
  // A place the files don't have (an old or mistyped link) shows the default place, never an endless "loading".
  const known = isBangladesh(requested) || data.status !== "ready" || (data.world?.places.places.some((w) => w.name === requested) ?? false);
  const place = known ? requested : DEFAULT_PLACE;
  const [decadeChoice, setDecadeChoice] = useState<number | null>(null);
  const players = useHistoryPlayers();
  const head = usePlayhead(HISTORY_PLAYER);
  const world = !isBangladesh(place);
  const layer = useLoaded(LAYER_LOADERS[metric], world);

  // Changing what is selected stops what is playing, so sound and chart never disagree.
  const choose =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      players.stop();
      set(value);
    };

  if (data.status === "loading") return <StatusBadge kind="loading">{t("history.loading")}</StatusBadge>;
  if (data.status === "error") return <StatusBadge kind="error">{t("history.error")}</StatusBadge>;

  const name = (p: string) => (isBangladesh(p) ? t(`place.${p}`) : p);
  const series = placeSeries(metric, place, data, { places: data.world?.places.places ?? [], layer: layer.value });
  const pickers = (
    <div className="space-y-3">
      <PlacePicker value={place} onChange={choose(onPlace)} world={data.world?.places.places ?? []} name={name} />
      <ChoiceGroup<HistoryMetric>
        label={t("history.metric")}
        showLabel
        value={metric}
        onChange={choose(onMetric)}
        options={HISTORY_METRICS.map((m) => ({ value: m, label: t(`history.${m}`) }))}
      />
    </div>
  );

  if (!series) {
    return (
      <div className="space-y-4">
        <p className="text-haze">{t("history.intro")}</p>
        {pickers}
        {world && layer.status === "error" ? <StatusBadge kind="error">{t("history.error")}</StatusBadge> : <StatusBadge kind="loading">{t("history.loadingWorld")}</StatusBadge>}
      </div>
    );
  }

  const decades = fullDecades(series.months).slice(0, DECADES_SHOWN);
  const decade = decadeChoice !== null && decades.includes(decadeChoice) ? decadeChoice : decades[0];
  const [start, end] = decade === undefined ? [0, 0] : decadeRange(series.months, decade);
  const unit = t(`history.unit.${metric}`);
  const voice = HISTORY_VOICE[metric];
  const spans: ChartSpan[] = [
    ...(decade === undefined ? [] : [{ from: start, to: end - 1, kind: "selected" as const }]),
    ...missingRuns(series.values).map(([from, to]) => ({ from: from - 0.5, to: to + 0.5, kind: "gap" as const })),
  ];

  const monthText = (i: number) => {
    const month = formatMonth(series.months[i], state.lang);
    const v = series.values[i];
    if (v === null) return t("history.noValue", { month });
    return t("history.monthValue", { month, value: metric === "rain" ? formatFixed(v, state.lang, 1) : formatSigned(v, state.lang, metric === "heat" ? 2 : 1), unit });
  };

  // One month, through the same voice as the decade (silent with sound off; the slider still announces it).
  const playMonth = (i: number, motion: ScrubMotion) =>
    players.playMonth(i, state.soundOn ? { label: monthText(i), values: [series.values[i]], voice } : null, motion);

  const play = () =>
    decade !== undefined &&
    players.playDecade({ label: `${name(place)}, ${t("history.decadeLabel", { decade })}`, values: series.values.slice(start, end), voice }, start);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="surface-plate space-y-4 rounded-plate p-4 lg:short:space-y-3">
        <p className="text-small text-haze">{t("history.intro")}</p>
        {pickers}
        {decades.length > 0 && (
          <ChoiceGroup<string>
            label={t("history.decade")}
            showLabel
            value={String(decade)}
            onChange={choose((d: string) => setDecadeChoice(Number(d)))}
            options={decades.map((d) => ({ value: String(d), label: t("history.decadeLabel", { decade: d }) }))}
          />
        )}
        {decade !== undefined && (
          <Button disabled={!state.soundOn} onClick={play} className="h-11 w-full justify-start gap-2 rounded-full bg-shapla px-4 text-body text-ink hover:bg-shapla/90">
            <Play aria-hidden="true" weight="fill" />
            {t("history.play", { decade })}
          </Button>
        )}
        {!state.soundOn && <p className="text-small text-haze">{t("thenNow.soundOff")}</p>}
      </div>

      <div className="surface-plate space-y-3 rounded-plate p-4 md:p-5">
        {/* The picked month on screen (its engine caption is left out); the slider announces it to screen readers. */}
        <p aria-hidden="true" className="min-h-8 font-serif text-title text-moon tabular-nums">
          {players.monthIndex !== null ? monthText(players.monthIndex) : name(place)}
        </p>
        <HistoryChart
          rows={series.months.map((month, i) => ({ i, month, value: series.values[i] }))}
          series={[{ key: "value", label: `${name(place)}: ${series.dataset}`, tone: "now" }]}
          spans={spans}
          unit={unit}
          zeroLine={metric === "heat" ? heatNormalLabel() : undefined}
          playheadIndex={head && players.playingFrom !== null ? players.playingFrom + head.index : players.monthIndex}
          scrub={{ value: players.monthIndex, label: t("history.scrub", { place: name(place) }), valueText: monthText, onChange: playMonth }}
          summary={t("history.summary", {
            metric: t(`history.${metric}`),
            place: name(place),
            from: formatMonth(series.months[0], state.lang),
            to: formatMonth(series.months[series.months.length - 1], state.lang),
          })}
        />
        <RecordNotes series={series} name={name} world={world && data.world ? { disclosure: data.world.manifest.disclosure } : null} />
      </div>
    </div>
  );
}
