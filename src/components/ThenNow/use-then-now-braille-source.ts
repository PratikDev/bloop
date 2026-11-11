"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { voiceScale, type BrailleSource, type ShapePoint, type ShapeScale } from "@/a11y/brailleSource";
import type { BrailleReading } from "@/a11y/brailleLines";
import { clean } from "@/a11y/brailleText";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle } from "@/lib/audio/types";
import { changeNote, waterSeries, yearSeries, type SeriesPoint } from "@/lib/then-now-braille";
import { partStats } from "@/lib/then-now-stats";
import { bi } from "@/lib/bi-text";
import { windowLabel, yearlyWindows } from "@/lib/then-now";
import type { ClimateCellName, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";
import { useAppState, useT } from "../AppState/use-app-state";
import type { Part } from "./use-then-now-player";

const UNIT: Record<Part, { unit: string; decimals: number }> = {
  heat: { unit: "°C", decimals: 2 },
  monsoon: { unit: "mm/day", decimals: 1 },
  water: { unit: "cm", decimals: 1 },
};
const NAME = { heat: "thenNow.part.heat", monsoon: "thenNow.part.monsoon", water: "thenNow.part.water" } as const satisfies Record<Part, string>;
const SHORT = { heat: "Heat", monsoon: "Rain", water: "Water" } as const satisfies Record<Part, string>;
const NOWHERE = { lat: 0, lon: 0 };

export interface ThenNowBrailleInput {
  part: Part;
  cityName: ClimateCellName;
  demo: DhakaThenNowDemo;
  grace: GraceContextFile;
  stats: ThenNowStatsFile | null;
}

export function useThenNowBrailleSource(input: ThenNowBrailleInput | null): BrailleSource | null {
  const { state } = useAppState();
  const t = useT();
  const [caret, setCaret] = useState<{ key: string; step: number } | null>(null);
  const playing = useRef<PlayerHandle | null>(null);
  useEffect(() => () => playing.current?.stop(), []);

  return useMemo<BrailleSource | null>(() => {
    if (!input) return null;
    const { part, cityName, demo, grace, stats } = input;
    const series: SeriesPoint[] = part === "water" ? waterSeries(grace) : yearSeries(yearlyWindows(demo, part));
    const points: ShapePoint[] = series.map((p, i) => ({ value: p.value, at: NOWHERE, step: i }));
    const lastWithData = series.reduce((last, p, i) => (p.value !== null ? i : last), series.length - 1);
    const key = `${cityName}-${part}`;
    const current = caret?.key === key ? caret.step : lastWithData;
    const values = series.map((p) => p.value).filter((v): v is number => v !== null);
    const { unit, decimals } = UNIT[part];
    const fallback: ShapeScale = { min: Math.min(...values), max: Math.max(...values), scale: "linear", unit };
    const place = bi((tl) => (part === "water" ? tl("thenNow.box.Bangladesh") : tl(`place.${cityName}`)));
    const windows = part === "water" ? null : yearlyWindows(demo, part);
    const note = stats ? changeNote(partStats(stats, cityName, part).items) : null;

    const reading = (i: number): BrailleReading => {
      const p = series[i];
      const win = p.window && windows ? clean(windowLabel(windows[p.window])) : "";
      return {
        short: SHORT[part],
        long: clean(`${t(NAME[part])}, ${place.en}`),
        layer: part,
        kind: p.value === null ? "nodata" : "value",
        value: p.value,
        decimals,
        below: false,
        snow: false,
        unit,
        place: NOWHERE,
        placeName: place,
        time: { iso: null, label: p.label, bn: p.bn },
        badge: "observation",
        status: "",
        relative: false,
        note: win ? { en: `${p.window === "A" ? "then" : "now"} ${win}`, bn: `${p.window === "A" ? "তখন" : "এখন"} ${win}` } : undefined,
        reviewNote: note ?? undefined,
      };
    };

    return {
      key: `then-now-${key}`,
      channels: [{ id: part, label: clean(t(NAME[part])) }],
      relative: false,
      modes: () => ["time"],
      scale: () => ({ ...voiceScale(part, fallback), unit }),
      view: () => ({ mode: "time", points, current }),
      reading: () => reading(current),
      go(_channel, _mode, point) {
        setCaret({ key, step: point.step });
        playing.current?.stop();
        const v = series[point.step]?.value ?? null;
        if (state.soundOn && v !== null) playing.current = audio.playSeries({ label: series[point.step].label, values: [v], voice: part }, { player: "thenNow.braille" });
      },
    };
  }, [input, caret, state.soundOn, t]);
}
