"use client";

import { useEffect, type RefObject } from "react";
import { useAppState } from "@/components/AppState/use-app-state";
import { subscribeTicker } from "@/hooks/use-ticker";
import { analyserFor } from "@/lib/audio-engines";

const SILENT_WIDTH = 125;
const BASE_WIDTH = 112;
const WIDTH_RANGE = 13;
const SILENCE = 0.01;
const ATTACK_MS = 60;
const RELEASE_MS = 300;

/** Widens a wordmark with the sound (motion item 7): wide when silent, or under reduced motion; otherwise follows the level. */
export function useWordmarkWidth(ref: RefObject<HTMLElement | SVGElement | null>, active: boolean): void {
  const { state } = useAppState();
  const { reduceMotion, mode } = state;

  useEffect(() => {
    const el = ref.current;
    if (!el || !active || reduceMotion) return;
    let samples: Uint8Array<ArrayBuffer> | null = null;
    let level = 0;
    const off = subscribeTicker((_, dt) => {
      const analyser = analyserFor(mode);
      if (analyser && samples?.length !== analyser.fftSize) samples = new Uint8Array(analyser.fftSize);
      let peak = 0;
      if (analyser && samples) {
        analyser.getByteTimeDomainData(samples);
        for (const s of samples) peak = Math.max(peak, Math.abs(s - 128) / 128);
      }
      // A fast rise and a slow fall, so the type follows the sound without flicker.
      level += (peak - level) * (1 - Math.exp(-dt / (peak > level ? ATTACK_MS : RELEASE_MS)));
      const width = level < SILENCE ? SILENT_WIDTH : Math.min(SILENT_WIDTH, BASE_WIDTH + WIDTH_RANGE * level);
      el.style.fontVariationSettings = `"wdth" ${width.toFixed(1)}`;
    }, el);
    return () => {
      off();
      el.style.removeProperty("font-variation-settings");
    };
  }, [ref, active, reduceMotion, mode]);
}
