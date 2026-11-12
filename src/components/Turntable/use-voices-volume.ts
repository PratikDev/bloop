"use client";

import { useCallback } from "react";
import { LIVE_VOICES } from "@/lib/audio-adapter/types";
import { useAppState } from "../AppState/use-app-state";

/**
 * The live voices' volume as one control ("Volume, all sounds"): the loudest of them, and setting it sets them all.
 * The app has no master volume; the deck's knob and the Layers drawer's slider both use this, so they always agree.
 */
export function useVoicesVolume(): { volume: number; setVolume(v: number): void } {
  const { state, dispatch } = useAppState();
  const volume = Math.max(...LIVE_VOICES.map((v) => state.mix[v].volume));
  const setVolume = useCallback(
    (v: number) => {
      const next = Math.min(1, Math.max(0, v));
      for (const voice of LIVE_VOICES) dispatch({ type: "setVoiceMix", voice, mix: { volume: next } });
    },
    [dispatch],
  );
  return { volume, setVolume };
}
