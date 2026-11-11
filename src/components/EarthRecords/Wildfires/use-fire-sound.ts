"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { LatLon } from "@/lib/data";
import { cellIndex } from "@/lib/data/grid";
import { FIRE_WEATHER_VOICE } from "@/lib/earth/classes";
import type { FireData } from "@/lib/earth/fire-data";
import type { FireReading } from "@/lib/earth/fire-text";
import { dayCount, seriesOf, type SeasonCase } from "@/lib/earth/firms";
import { nextDay } from "@/lib/earth/fwi";
import { geigerBrightness, geigerRate } from "@/lib/earth/geiger";
import type { PilotDay } from "@/lib/earth/pilot";
import { createChordLayer } from "@/lib/earth/sound/chord-layer";
import { createGeigerLayer } from "@/lib/earth/sound/geiger-layer";
import type { FirmsDailyBlock, FirmsDailyRegion, FirmsNrtSource } from "@/types/data-contract";

const REPLAY_STEP_MS = 3000;
const SEASON_STEP_MS = 700;

export type Sequence = { kind: "replay"; step: number } | { kind: "season"; key: string; step: number } | null;

interface FireSoundInput {
  sounding: boolean;
  playing: boolean;
  reading: FireReading | null;
  chordOn: boolean;
  clicksOn: boolean;
  at: LatLon;
  sequence: Sequence;
  setSequence: Dispatch<SetStateAction<Sequence>>;
  archive: PilotDay[] | null;
  daily: FirmsDailyBlock | null;
  src: FirmsNrtSource | null;
  region: FirmsDailyRegion;
  data: FireData | null;
  seasonCases: SeasonCase[];
}

export function useFireSound(i: FireSoundInput) {
  const { sounding, playing, reading, chordOn, clicksOn, at, sequence, setSequence, archive, daily, src, region, data, seasonCases } = i;
  const chord = useRef(createChordLayer(FIRE_WEATHER_VOICE));
  const geiger = useRef(createGeigerLayer());

  const stopAll = useCallback(() => {
    chord.current.stop();
    geiger.current.stop();
  }, []);

  useEffect(() => {
    if (!sounding || !reading) {
      if (sequence === null) stopAll();
      return;
    }
    chord.current.set(chordOn ? reading.fwiCode : null, at.lon);
    const count = reading.count?.count ?? 0;
    geiger.current.set(clicksOn ? geigerRate(count) : 0, geigerBrightness(count, reading.count?.frpSumMW ?? 0), at.lon);
  }, [sounding, reading, chordOn, clicksOn, at.lon, sequence, stopAll]);

  useEffect(() => {
    if (sequence?.kind !== "replay" || !archive || !daily || !src) return;
    const d = archive[sequence.step];
    chord.current.set(chordOn && data ? d.codes[cellIndex(data.fwi.meta.grid, at.lat, at.lon)] : null, at.lon);
    const series = seriesOf(daily, region, src);
    const c = series ? dayCount(series, nextDay(d.date)) : null;
    geiger.current.set(clicksOn && c ? geigerRate(c.count) : 0, c ? geigerBrightness(c.count, c.frpSumMW) : null, at.lon);
    const timer = setTimeout(() => setSequence((s) => (s?.kind === "replay" ? { kind: "replay", step: s.step + 1 } : s)), REPLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [sequence, archive, daily, src, region, at, chordOn, clicksOn, data, setSequence]);

  useEffect(() => {
    if (sequence?.kind !== "season") return;
    const c = seasonCases.find((x) => x.key === sequence.key);
    if (!c) return;
    chord.current.stop();
    const count = c.series.counts[sequence.step];
    geiger.current.set(geigerRate(count), null, at.lon);
    const timer = setTimeout(() => setSequence((s) => (s?.kind === "season" ? { ...s, step: s.step + 1 } : s)), SEASON_STEP_MS);
    return () => clearTimeout(timer);
  }, [sequence, seasonCases, at.lon, setSequence]);

  useEffect(() => stopAll, [stopAll]);
  useEffect(() => {
    if (sequence === null && !playing) stopAll();
  }, [sequence, playing, stopAll]);

  return { chordTones: () => chord.current.sounding() };
}
