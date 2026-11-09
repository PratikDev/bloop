"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useLoaded } from "@/hooks/use-loaded";
import { loadOfficialIndex, loadSequenceIndex } from "@/lib/data";
import { buildRecords, currentRecord, type JukeboxRecord } from "@/lib/records";
import { locationForMode, PAGE_PATHS } from "@/router/modes";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { RecordsContext, type PlayOptions, type RecordsValue } from "./use-records";

const LEGEND_KEY = "jukebox.hint.legend.v1";
const loadFrameCount = () => loadSequenceIndex().then((index) => index.frames.length);

function legendRemembered(): boolean {
  try {
    return localStorage.getItem(LEGEND_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberLegend(): void {
  try {
    localStorage.setItem(LEGEND_KEY, "1");
  } catch {
    // Storage blocked: the tag may show again next visit, which is harmless.
  }
}

/** Records that play on the map: picked from another page, they wait until Listen is open. */
type OnMap = "timeLapse" | "sweep";

/**
 * The record list and what picking one does: one place for the rack, the mini player and code entry.
 * The two small files it needs load only after Start, so Home stays light.
 */
export function RecordsProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState();
  const commands = useCommands();
  const timeLapse = useTimeLapse();
  const announce = useAnnounce();
  const t = useT();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  // Official records opens without the start gate, so its codes load there too.
  const official = useLoaded(loadOfficialIndex, state.started || state.mode === "official").value;
  const frames = useLoaded(loadFrameCount, state.started).value;
  const [legendPlayed, setLegendPlayed] = useState(legendRemembered);
  const waiting = useRef<OnMap | null>(null);

  const records = useMemo(() => buildRecords({ official: official?.records ?? [], frames }), [official, frames]);
  const timeLapseOn = timeLapse.status === "loading" || timeLapse.status === "playing";
  const current = currentRecord(records, {
    mode: state.mode,
    track: state.track,
    timeLapse: timeLapseOn,
    part: search.part,
    official: state.mode === "official" && typeof search.record === "string" ? search.record : undefined,
  });

  const { start: startTimeLapse, stop: stopTimeLapse } = timeLapse;
  const { playSweep } = commands;
  const runOnMap = useCallback(
    (what: OnMap) => {
      if (what === "timeLapse") void startTimeLapse();
      else playSweep();
    },
    [startTimeLapse, playSweep],
  );

  // Leaving a page stops the time-lapse, so a record picked elsewhere starts once Listen is open.
  useEffect(() => {
    if (state.mode !== "explore" || !waiting.current) return;
    const what = waiting.current;
    waiting.current = null;
    runOnMap(what);
  }, [state.mode, runOnMap]);

  const play = useCallback(
    (record: JukeboxRecord, options?: PlayOptions) => {
      const { action } = record;
      const toListen = () => {
        if (state.mode !== "explore" && !options?.stay) void navigate(locationForMode("explore"));
      };
      const onMap = (what: OnMap) => {
        if (state.mode === "explore") return runOnMap(what);
        waiting.current = what;
        toListen();
      };
      // The time-lapse's own strip stops it; announcing "now playing" then would be wrong.
      if (action.kind === "timeLapse" && timeLapseOn) return stopTimeLapse();
      if (timeLapseOn) stopTimeLapse();
      if (action.kind !== "legend" || state.soundOn) announce(t("records.nowPlaying", { code: record.code, title: record.title(t) }));

      switch (action.kind) {
        case "legend":
          // Always the full warm-up, whichever track was on.
          dispatch({ type: "setTrack", track: "both" });
          commands.playLegend("both");
          rememberLegend();
          setLegendPlayed(true);
          return toListen();
        case "track":
          dispatch({ type: "setTrack", track: action.track });
          if (state.soundOn && !state.playing) dispatch({ type: "setPlaying", playing: true });
          return toListen();
        case "thenNow":
          return void navigate({ to: PAGE_PATHS.thenNow, search: { part: action.part, ...(search.city ? { city: search.city } : {}) } });
        case "official":
          return void navigate({ to: PAGE_PATHS.official, search: { record: action.record } });
        case "tour":
          return commands.setMode("story");
        case "timeLapse":
          return onMap("timeLapse");
        case "sweep":
          return onMap("sweep");
      }
    },
    [state.mode, state.soundOn, state.playing, timeLapseOn, stopTimeLapse, announce, t, dispatch, commands, navigate, search.city, runOnMap],
  );

  const value = useMemo<RecordsValue>(() => ({ records, current, legendPlayed, play }), [records, current, legendPlayed, play]);
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}
