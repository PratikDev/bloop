"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureDataAudio } from "@/lib/earth/sound/out";
import { useAppState } from "../AppState/use-app-state";

/**
 * A DATA record's Play / Stop: Play starts the engine inside the click; Stop, the app's Stop (Esc, the dock) and
 * leaving the record all end the sound (`onStop` releases the record's layers).
 */
export function useRecordPlay(onStop: () => void) {
  const { state } = useAppState();
  const [playing, setPlaying] = useState(false);
  // The app's Stop turns the record off (adjusted while rendering when the app's state changes).
  const [appPlaying, setAppPlaying] = useState(state.playing);
  if (appPlaying !== state.playing) {
    setAppPlaying(state.playing);
    if (!state.playing) setPlaying(false);
  }
  useEffect(() => {
    if (!playing) onStop();
  }, [playing, onStop]);
  useEffect(() => onStop, [onStop]);
  const play = useCallback(async () => {
    await ensureDataAudio();
    setPlaying(true);
  }, []);
  const stop = useCallback(() => setPlaying(false), []);
  return { playing: playing && state.soundOn, play, stop };
}
