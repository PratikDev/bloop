"use client";

import { useEffect } from "react";
import { audio } from "@/lib/audio-adapter";
import { LIVE_VOICES } from "@/lib/audio-adapter/types";
import type { LiveFields } from "@/lib/data";
import { readAt } from "@/lib/reading";
import type { AppState } from "../AppState/reducer";

/** Keeps the sound engine in step with the app state. */
export function useSoundSync(state: AppState, fields: LiveFields | null): void {
  const { started, soundOn, playing, introDone, cursor, track, mix, solo, allMuted, mode } = state;

  useEffect(() => audio.setTrackMode(track), [track]);
  useEffect(() => audio.setSolo(solo), [solo]);
  useEffect(() => audio.setAllMuted(allMuted), [allMuted]);
  useEffect(() => {
    for (const voice of LIVE_VOICES) {
      audio.setVoiceVolume(voice, mix[voice].volume);
      audio.setVoiceMuted(voice, mix[voice].muted);
    }
  }, [mix]);

  useEffect(() => {
    if (!started || !soundOn || !fields) return;
    if (!playing || !introDone || mode !== "explore") {
      audio.silenceLive();
      return;
    }
    const r = readAt(fields, cursor);
    audio.setOcean(r.ocean.valueC, cursor.lon);
    audio.setRain(r.rain.mmPerHour, r.rain.phase, cursor.lon);
  }, [started, soundOn, playing, introDone, cursor, fields, mode]);
}
