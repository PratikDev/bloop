"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";
import { audio } from "@/lib/audio-adapter";
import { readPalette } from "@/lib/css-tokens";
import { useAppState } from "./AppState/use-app-state";

const FPS = 30;
const REDUCED_FPS = 10;

/** The live output waveform (AnalyserNode, time domain). Flat when silent. */
export function Waveform({ className }: { className?: string }) {
  const { state } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fps = state.reduceMotion ? REDUCED_FPS : FPS;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const color = readPalette().shapla;
    let samples: Uint8Array<ArrayBuffer> | null = null;
    let last = 0;
    let raf = 0;

    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || ms - last < 1000 / fps) return;
      last = ms;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) canvas.width = w * dpr;
      if (canvas.height !== h * dpr) canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const analyser = audio.getAnalyser();
      if (analyser && (!samples || samples.length !== analyser.fftSize)) samples = new Uint8Array(analyser.fftSize);
      if (analyser && samples) analyser.getByteTimeDomainData(samples);

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;
      const n = samples?.length ?? 2;
      for (let i = 0; i < n; i++) {
        const v = samples ? (samples[i] - 128) / 128 : 0;
        const x = (i / (n - 1)) * w;
        const y = h / 2 - v * (h / 2) * 0.9;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [fps]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("h-8 w-32", className)} />;
}
