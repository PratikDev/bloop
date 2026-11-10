"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import type { LatLon } from "@/lib/data";
import { cellIndex } from "@/lib/data/grid";
import { classAt } from "@/lib/earth/class-grid";
import { FIRE_WEATHER_VOICE } from "@/lib/earth/classes";
import { loadArchiveGrids, loadFireData } from "@/lib/earth/fire-data";
import type { FireReading } from "@/lib/earth/fire-text";
import { boxCentre, chtSeasonCases, dailyDays, dayCount, regionsAt, seriesOf, type SeasonCase } from "@/lib/earth/firms";
import { nextDay } from "@/lib/earth/fwi";
import { geigerBrightness, geigerRate } from "@/lib/earth/geiger";
import { pilotRows, pilotSummary, type PilotDay } from "@/lib/earth/pilot";
import { activeRegions } from "@/lib/earth/regions";
import { createChordLayer } from "@/lib/earth/sound/chord-layer";
import { createGeigerLayer } from "@/lib/earth/sound/geiger-layer";
import { ensureDataAudio } from "@/lib/earth/sound/out";
import type { FirmsDailyRegion, FirmsNrtSource } from "@/types/data-contract";
import { useAppState } from "../../AppState/use-app-state";

/** A replay step and a fire-season day last this long (design choices). */
const REPLAY_STEP_MS = 3000;
const SEASON_STEP_MS = 700;
const FIRST_REGION: FirmsDailyRegion = "Bangladesh";

export type Sequence = { kind: "replay"; step: number } | { kind: "season"; key: string; step: number } | null;

/** The fires and fire-weather record (P2): its data, needle, choices, the two sound layers and the two sequences. */
export function useWildfires() {
  const { state } = useAppState();
  const { value: data, error } = useLoaded(loadFireData);
  const [needle, setNeedle] = useState<LatLon | null>(null);
  const [region, setRegion] = useState<FirmsDailyRegion>(FIRST_REGION);
  const [source, setSource] = useState<FirmsNrtSource | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [chordOn, setChordOn] = useState(true);
  const [clicksOn, setClicksOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [rawSequence, setSequence] = useState<Sequence>(null);
  const [archive, setArchive] = useState<PilotDay[] | null>(null);
  const chord = useRef(createChordLayer(FIRE_WEATHER_VOICE));
  const geiger = useRef(createGeigerLayer());

  const daily = data?.daily ?? null;
  const at = useMemo(() => needle ?? (daily ? boxCentre(daily.boxes[FIRST_REGION]) : { lat: 0, lon: 0 }), [needle, daily]);
  const src = source ?? daily?.sources[0] ?? null;
  const days = useMemo(() => (daily ? dailyDays(daily) : []), [daily]);
  const chosenDay = day ?? days[days.length - 1] ?? null;

  const reading: FireReading | null = useMemo(() => {
    if (!data || !daily || !src || !chosenDay) return null;
    const series = seriesOf(daily, region, src);
    return {
      fwiCode: classAt(data.fwi, at.lat, at.lon),
      forDay: nextDay(data.fwi.meta.frame_time_utc.slice(0, 10)),
      region,
      source: src,
      day: chosenDay,
      count: series ? dayCount(series, chosenDay) : null,
    };
  }, [data, daily, src, chosenDay, region, at]);

  const regions = useMemo(() => (data ? activeRegions(data.fwi.meta.grid, data.fwi.codes) : []), [data]);
  const seasonCases: SeasonCase[] = useMemo(() => (data ? chtSeasonCases(data.firms) : []), [data]);
  /** Bangladesh's latest day across every sensor: all zero = off-season. */
  const offSeason = useMemo(() => {
    if (!daily || !days.length) return null;
    const last = days[days.length - 1];
    const counts = daily.sources.map((s) => {
      const series = seriesOf(daily, "Bangladesh", s);
      return series ? (dayCount(series, last)?.count ?? null) : null;
    });
    return counts.every((c) => c === 0) ? last : null;
  }, [daily, days]);
  const pilot = useMemo(() => (archive && daily && data ? { rows: pilotRows(daily, data.fwi.meta.grid, archive), daily } : null), [archive, daily, data]);
  const summary = useMemo(() => (pilot ? pilotSummary(pilot.rows, pilot.daily.sources) : []), [pilot]);

  const loadArchive = useCallback(async () => {
    if (!data || archive) return archive;
    const grids = await loadArchiveGrids(data);
    setArchive(grids);
    return grids;
  }, [data, archive]);

  // A sequence past its last day is over (no state to reset: it is derived here).
  const seqLength =
    rawSequence?.kind === "replay" ? (archive?.length ?? 0) : rawSequence?.kind === "season" ? (seasonCases.find((c) => c.key === rawSequence.key)?.series.days.length ?? 0) : 0;
  const sequence: Sequence = rawSequence && rawSequence.step < seqLength ? rawSequence : null;

  // Stop (Esc, the dock) stops the record and its sequence (adjusted while rendering, when the app's state changes).
  const [appPlaying, setAppPlaying] = useState(state.playing);
  if (appPlaying !== state.playing) {
    setAppPlaying(state.playing);
    if (!state.playing) {
      setPlaying(false);
      setSequence(null);
    }
  }

  const stopAll = useCallback(() => {
    chord.current.stop();
    geiger.current.stop();
  }, []);

  // The two layers follow the needle and the choices while playing (not during a sequence).
  const sounding = playing && state.soundOn && sequence === null;
  useEffect(() => {
    if (!sounding || !reading) {
      if (sequence === null) stopAll();
      return;
    }
    chord.current.set(chordOn ? reading.fwiCode : null, at.lon);
    const count = reading.count?.count ?? 0;
    geiger.current.set(clicksOn ? geigerRate(count) : 0, geigerBrightness(count, reading.count?.frpSumMW ?? 0), at.lon);
  }, [sounding, reading, chordOn, clicksOn, at.lon, sequence, stopAll]);

  // Forecast meets outcome: each archived day's chord at the needle, the next day's FIRMS clicks over it.
  useEffect(() => {
    if (sequence?.kind !== "replay" || !archive || !daily || !src) return;
    const d = archive[sequence.step];
    chord.current.set(chordOn && data ? d.codes[cellIndex(data.fwi.meta.grid, at.lat, at.lon)] : null, at.lon);
    const series = seriesOf(daily, region, src);
    const c = series ? dayCount(series, nextDay(d.date)) : null;
    geiger.current.set(clicksOn && c ? geigerRate(c.count) : 0, c ? geigerBrightness(c.count, c.frpSumMW) : null, at.lon);
    const timer = setTimeout(() => setSequence((s) => (s?.kind === "replay" ? { kind: "replay", step: s.step + 1 } : s)), REPLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [sequence, archive, daily, src, region, at, chordOn, clicksOn, data]);

  // The fire-season example: the case's days, one after another, as clicks (no forecast for those years: no chord).
  useEffect(() => {
    if (sequence?.kind !== "season") return;
    const c = seasonCases.find((x) => x.key === sequence.key);
    if (!c) return;
    chord.current.stop();
    const count = c.series.counts[sequence.step];
    geiger.current.set(geigerRate(count), null, at.lon);
    const timer = setTimeout(() => setSequence((s) => (s?.kind === "season" ? { ...s, step: s.step + 1 } : s)), SEASON_STEP_MS);
    return () => clearTimeout(timer);
  }, [sequence, seasonCases, at.lon]);

  // Leaving the record stops everything.
  useEffect(() => stopAll, [stopAll]);
  useEffect(() => {
    if (sequence === null && !playing) stopAll();
  }, [sequence, playing, stopAll]);

  const play = useCallback(async () => {
    await ensureDataAudio();
    setSequence(null);
    setPlaying(true);
  }, []);
  const stop = useCallback(() => {
    setPlaying(false);
    setSequence(null);
  }, []);
  const startReplay = useCallback(async () => {
    await ensureDataAudio();
    await loadArchive();
    setPlaying(false);
    setSequence({ kind: "replay", step: 0 });
  }, [loadArchive]);
  const startSeason = useCallback(async (key: string) => {
    await ensureDataAudio();
    setPlaying(false);
    setSequence({ kind: "season", key, step: 0 });
  }, []);
  const moveNeedle = useCallback(
    (to: LatLon) => {
      setNeedle(to);
      if (daily) {
        const r = regionsAt(daily, to.lat, to.lon)[0];
        if (r) setRegion(r);
      }
    },
    [daily],
  );
  const chooseRegion = useCallback(
    (r: FirmsDailyRegion) => {
      setRegion(r);
      if (daily) setNeedle(boxCentre(daily.boxes[r]));
    },
    [daily],
  );

  return {
    data,
    error,
    daily,
    needle: at,
    moveNeedle,
    region,
    chooseRegion,
    source: src,
    setSource,
    days,
    day: chosenDay,
    setDay,
    reading,
    chordOn,
    setChordOn,
    clicksOn,
    setClicksOn,
    playing,
    play,
    stop,
    sequence,
    startReplay,
    startSeason,
    archive,
    loadArchive,
    pilot,
    summary,
    regions,
    seasonCases,
    offSeason,
    chordTones: () => chord.current.sounding(),
  };
}

export type WildfiresState = ReturnType<typeof useWildfires>;

