"use client";

import { useEffect, type RefObject } from "react";
import { subscribeTicker } from "@/hooks/use-ticker";
import { useRecordSounding } from "@/hooks/use-record-sounding";
import { analyserFor } from "@/lib/audio-engines";
import { useAppState } from "../../AppState/use-app-state";
import type { DeckView } from "./deck-view";

/** As the chosen record's equaliser: 15 readings a second, each level one of 4 steps. */
const FPS = 15;
const STEPS = 4;
/** The low band (Hz) the grille follows: the app's voices start about 100 Hz. */
const LOW_BAND = [40, 300] as const;

const quantise = (v: number) => Math.ceil(Math.min(1, Math.max(0, v)) * STEPS) / STEPS;

/**
 * Feeds the deck the sound's levels for the speaker grille (the low band) and the stylus tremble (the overall level),
 * while the record sounds; nothing under reduced motion or with the sound paused (the deck stays still).
 */
export function useDeckLevels(view: DeckView | null, canvasRef: RefObject<HTMLCanvasElement | null>): void {
  const { state } = useAppState();
  const sounding = useRecordSounding();
  const live = sounding && state.soundOn && state.playing && !state.reduceMotion;
  const { mode } = state;

  useEffect(() => {
    if (!view) return;
    view.setLevels(null);
    if (!live) return;
    let samples: Uint8Array<ArrayBuffer> | null = null;
    let last = 0;
    const off = subscribeTicker((ms) => {
      if (ms - last < 1000 / FPS) return;
      last = ms;
      const analyser = analyserFor(mode);
      if (!analyser) return;
      if (!samples || samples.length !== analyser.frequencyBinCount) samples = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(samples);
      const hzPerBin = analyser.context.sampleRate / 2 / samples.length;
      const a = Math.floor(LOW_BAND[0] / hzPerBin);
      const b = Math.max(a + 1, Math.ceil(LOW_BAND[1] / hzPerBin));
      // Peaks, not averages: a pure tone puts its energy in one or two bins.
      let low = 0;
      let all = 0;
      for (let k = 0; k < samples.length; k++) {
        all = Math.max(all, samples[k]);
        if (k >= a && k < b) low = Math.max(low, samples[k]);
      }
      view.setLevels({ low: quantise(low / 255), overall: quantise(all / 255) });
    }, canvasRef.current);
    return () => {
      off();
      view.setLevels(null);
    };
  }, [view, canvasRef, live, mode]);
}
