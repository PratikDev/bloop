"use client";

import { useEffect, useRef } from "react";
import { subscribeTicker } from "@/hooks/use-ticker";
import { useRecordSounding } from "@/hooks/use-record-sounding";
import { analyserFor } from "@/lib/audio-engines";
import { cn } from "@/lib/utils";
import { useAppState } from "../AppState/use-app-state";

/** The still mark: three bars at fixed heights (a share of the 16 px box). */
const STILL = [0.375, 0.875, 0.625] as const;
/** Motion item 5: 15 frames a second, each bar one of 4 heights. */
const FPS = 15;
const STEPS = 4;
/** Low, mid and high bands in Hz: the app's voices are tones between about 100 Hz and 2 kHz, so the bands sit there. */
const BANDS = [
  [40, 300],
  [300, 1000],
  [1000, 4000],
] as const;

const quantise = (v: number) => Math.max(1, Math.ceil(Math.min(1, v) * STEPS)) / STEPS;

/**
 * The "this one" mark on a chosen record: three bars. While the current record sounds they follow the sound's low,
 * mid and high bands; otherwise (or with Reduce motion) they are a still mark. Decorative: the record says it is
 * chosen in words.
 */
export function Equaliser({ className }: { className?: string }) {
  const { state } = useAppState();
  const sounding = useRecordSounding();
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const box = useRef<HTMLSpanElement>(null);
  const live = sounding && !state.reduceMotion;
  const { mode } = state;

  useEffect(() => {
    const still = () => bars.current.forEach((b, i) => b && (b.style.transform = `scaleY(${STILL[i]})`));
    still();
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
      BANDS.forEach(([from, to], i) => {
        const a = Math.floor(from / hzPerBin);
        const b = Math.max(a + 1, Math.ceil(to / hzPerBin));
        // The band's loudest bin: a pure tone puts its energy in one or two bins, which an average would hide.
        let peak = 0;
        for (let k = a; k < b; k++) peak = Math.max(peak, samples?.[k] ?? 0);
        const bar = bars.current[i];
        if (bar) bar.style.transform = `scaleY(${quantise(peak / 255)})`;
      });
    }, box.current);
    return () => {
      off();
      still();
    };
  }, [live, mode]);

  return (
    <span ref={box} aria-hidden="true" className={cn("flex h-4 items-end gap-0.5", className)}>
      {STILL.map((share, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          style={{ transform: `scaleY(${share})` }}
          className="h-4 w-1 origin-bottom rounded-xs bg-moon"
        />
      ))}
    </span>
  );
}
