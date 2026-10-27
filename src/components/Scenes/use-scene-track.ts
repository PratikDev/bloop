"use client";

import { useEffect, useRef } from "react";
import { audio } from "@/lib/audio-adapter";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { useAppState } from "../AppState/use-app-state";

/** The live voices a scene plays, whatever the Turntable's record; the record's own mode comes back on exit. */
export function useSceneTrack(mode: TrackMode): void {
  const { state } = useAppState();
  const track = useRef(state.track);
  useEffect(() => {
    track.current = state.track;
  });
  useEffect(() => {
    audio.silenceLive();
    audio.setTrackMode(mode);
    return () => {
      audio.silenceLive();
      audio.setTrackMode(track.current);
    };
  }, [mode]);
}
