"use client";

import { useEffect, useRef, type RefObject } from "react";
import { mapVoice, normalise, voiceSpec } from "@/lib/audio/mapping";
import { audio } from "@/lib/audio-adapter";
import { readPalette } from "@/lib/css-tokens";
import type { LatLon } from "@/lib/data";
import { pxPerDeg, toXY } from "@/lib/geo";
import type { SweepVisual } from "../Commands/use-commands";
import { drawCursor, drawRings, drawStaticRing, drawSweepDot, drawSweepRing, type Ring } from "./overlay";
import { prepareCanvas, type CanvasSize } from "./use-canvas-size";

export interface OverlayInputs {
  cursor: LatLon;
  oceanC: number | null; // only when the ocean voice is audible
  rainMm: number | null; // only when rain or snow is audible
  reduceMotion: boolean;
}

// Ring shapes (design-plan §5 #2). Ocean spacing follows pitch.
const OCEAN = { periodSec: 0.6, life: 1.6, speedAt440: 26, alpha: 0.8 };
const RAIN = { life: 0.7, speed: 30, alpha: 0.35, alphaPerGain: 0.6 };
const SNOW = { life: 1.4, speed: 14, alpha: 0.25, alphaPerGain: 0.4 };
const SWEEP_LINGER_SEC = 0.8;

const audioNow = () => audio.getAnalyser()?.context.currentTime ?? performance.now() / 1000;

/** Redraws the overlay every animation frame while the tab is visible. */
export function useOverlayLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  size: CanvasSize | null,
  inputs: OverlayInputs,
  sweepRef: RefObject<SweepVisual | null>,
): void {
  const inputsRef = useRef(inputs);
  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const ctx = prepareCanvas(canvas, size);
    if (!ctx) return;
    const palette = readPalette();
    const px = pxPerDeg(size.width, size.height);
    let rings: Ring[] = [];
    let lastOceanRing = -Infinity;
    // Steps arrive up to 100 ms before they sound; draw the latest one that has started.
    let sweepSteps: { index: number; time: number }[] = [];
    let raf = 0;

    const off = audio.onAudioEvent((e) => {
      if (e.kind === "step" && e.player === "sweep") {
        if (e.index === 0) sweepSteps = [];
        sweepSteps.push({ index: e.index, time: e.time });
      }
      if (e.kind !== "drop" || inputsRef.current.rainMm === null || inputsRef.current.reduceMotion) return;
      const shape = e.voice === "rain" ? RAIN : SNOW;
      rings.push({ t0: e.time, life: shape.life, r0: 0, speed: shape.speed, alpha: shape.alpha + shape.alphaPerGain * e.gain });
    });

    const drawSweep = (now: number): boolean => {
      const sweep = sweepRef.current;
      while (sweepSteps.length > 1 && sweepSteps[1].time <= now) sweepSteps.shift();
      const step = sweepSteps[0];
      if (!sweep || !step || now > step.time + SWEEP_LINGER_SEC) return false;
      if (now < step.time) return true;
      const point = sweep.points[step.index];
      if (inputsRef.current.reduceMotion) {
        const p = toXY(point, size.width, size.height);
        drawSweepDot(ctx, palette, p.x, p.y);
        return true;
      }
      const { center } = sweep;
      const c = toXY(center, size.width, size.height);
      const current = sweep.ring[step.index];
      for (let k = 0; k <= current; k++) {
        const r = sweep.ringDeg[k];
        const lonScale = Math.max(Math.cos((center.lat * Math.PI) / 180), 0.2);
        drawSweepRing(ctx, palette, c.x, c.y, (r / lonScale) * px.x, r * px.y, k === current ? 1 : 0.25);
      }
      return true;
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const now = audioNow();
      const { cursor, oceanC, rainMm, reduceMotion } = inputsRef.current;
      ctx.clearRect(0, 0, size.width, size.height);
      const sweeping = drawSweep(now);
      const { x, y } = toXY(cursor, size.width, size.height);

      if (!sweeping) {
        if (reduceMotion) {
          const t = staticRingValue(oceanC, rainMm);
          if (t !== null) drawStaticRing(ctx, palette, x, y, t);
        } else {
          const freq = mapVoice("ocean", oceanC);
          if (freq !== null && now - lastOceanRing >= OCEAN.periodSec) {
            lastOceanRing = now;
            rings.push({ t0: now, life: OCEAN.life, r0: 0, speed: OCEAN.speedAt440 * (440 / freq), alpha: OCEAN.alpha });
          }
          rings = drawRings(ctx, palette, rings, now, x, y);
        }
      } else {
        rings = [];
      }
      drawCursor(ctx, palette, x, y);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(draw);
    return () => {
      off();
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canvasRef, size, sweepRef]);
}

/** Reduced motion: which value sizes the still ring (ocean first, then rain), 0..1. */
function staticRingValue(oceanC: number | null, rainMm: number | null): number | null {
  const ocean = voiceSpec("ocean").mapping;
  const rain = voiceSpec("rain").mapping;
  if (oceanC !== null && ocean?.kind === "continuous") return normalise(oceanC, ocean.input);
  if (rainMm !== null && rainMm > 0 && rain?.kind === "continuous") return normalise(rainMm, rain.input);
  return null;
}
