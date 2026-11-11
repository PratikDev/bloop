"use client";

import { useCallback, useMemo, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import type { LatLon } from "@/lib/data";
import { classAt } from "@/lib/earth/class-grid";
import { loadArchiveGrids, loadFireData } from "@/lib/earth/fire-data";
import type { FireReading } from "@/lib/earth/fire-text";
import { boxCentre, chtSeasonCases, dailyDays, dayCount, regionsAt, seriesOf, type SeasonCase } from "@/lib/earth/firms";
import { nextDay } from "@/lib/earth/fwi";
import { pilotRows, pilotSummary, type PilotDay } from "@/lib/earth/pilot";
import { activeRegions } from "@/lib/earth/regions";
import { ensureDataAudio } from "@/lib/earth/sound/out";
import type { FirmsDailyRegion, FirmsNrtSource } from "@/types/data-contract";
import { useAppState } from "../../AppState/use-app-state";
import { useFireSound, type Sequence } from "./use-fire-sound";

const FIRST_REGION: FirmsDailyRegion = "Bangladesh";

export type { Sequence };

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

  const seqLength =
    rawSequence?.kind === "replay" ? (archive?.length ?? 0) : rawSequence?.kind === "season" ? (seasonCases.find((c) => c.key === rawSequence.key)?.series.days.length ?? 0) : 0;
  const sequence: Sequence = rawSequence && rawSequence.step < seqLength ? rawSequence : null;

  const [appPlaying, setAppPlaying] = useState(state.playing);
  if (appPlaying !== state.playing) {
    setAppPlaying(state.playing);
    if (!state.playing) {
      setPlaying(false);
      setSequence(null);
    }
  }

  const sounding = playing && state.soundOn && sequence === null;
  const { chordTones } = useFireSound({ sounding, playing, reading, chordOn, clicksOn, at, sequence, setSequence, archive, daily, src, region, data: data ?? null, seasonCases });

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
    chordTones,
  };
}

export type WildfiresState = ReturnType<typeof useWildfires>;

