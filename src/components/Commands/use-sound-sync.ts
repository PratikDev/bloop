"use client";

import { useEffect } from "react";
import { audio as l2 } from "@/lib/audio-adapter";
import { LIVE_VOICES } from "@/lib/audio-adapter/types";
import { audio as jukebox } from "@/lib/audio-jukebox";
import { liveEngine, mixBoth, otherEngine } from "@/lib/audio-engines";
import type { LiveFields } from "@/lib/data";
import { readAt, type Reading } from "@/lib/reading";
import { stepSound } from "../AppState/access";
import { isLiveMode, type AppState } from "../AppState/reducer";

type LiveEngine = Pick<typeof l2, "setOcean" | "setRain">;

/** Sends one reading to the live voices: Listen's cursor (L2), or the turntable's needle (`jukebox`). */
export function playReading(r: Reading, lon: number, engine: LiveEngine = l2): void {
  engine.setOcean(r.ocean.valueC, lon);
  engine.setRain(r.rain.mmPerHour, r.rain.phase, lon);
}

/** The Turntable needle's engine (needle-sound.ts). */
export const NEEDLE_ENGINE: LiveEngine = jukebox;

/** Keeps both sound engines in step with the app state (src/lib/audio-engines.ts). */
export function useSoundSync(state: AppState, fields: LiveFields | null): void {
  const { started, soundOn, playing, introDone, cursor, track, mix, solo, allMuted, mode } = state;

  useEffect(() => mixBoth.setTrackMode(track), [track]);
  useEffect(() => mixBoth.setSolo(solo), [solo]);
  useEffect(() => mixBoth.setAllMuted(allMuted), [allMuted]);
  useEffect(() => {
    for (const voice of LIVE_VOICES) {
      mixBoth.setVoiceVolume(voice, mix[voice].volume);
      mixBoth.setVoiceMuted(voice, mix[voice].muted);
    }
  }, [mix]);

  // The live voices sound on the page's engine only: the other one's stay silent.
  useEffect(() => {
    if (started && soundOn) otherEngine(mode).silenceLive();
  }, [started, soundOn, mode]);

  useEffect(() => {
    // Story Mode owns the live voices while it runs.
    if (!started || !soundOn || !fields || mode === "story") return;
    const engine = liveEngine(mode);
    if (!playing || !introDone || !isLiveMode(mode) || !stepSound(state)) {
      engine.silenceLive();
      return;
    }
    if (mode === "turntable" || state.heldFrame !== null) return;
    playReading(readAt(fields, cursor), cursor.lon, engine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, soundOn, playing, introDone, cursor, fields, mode, state.channels, state.heldFrame]);
}
