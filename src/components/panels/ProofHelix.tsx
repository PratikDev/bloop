"use client";

import { useEffect, useRef } from "react";
import { readPalette } from "@/lib/css-tokens";
import { useAppState } from "../AppState/use-app-state";

const WIDTH = 320;
const HEIGHT = 72;
const TURNS = 3; // strand turns across the width (drawing only)
const STEPS = 160;

/**
 * 3D-18, the proof helix: the EIC frame's tone and NASA's file tone as two strands of one helix.
 * The phase between them turns at the beat rate |f1 − f2| per second (the same Ocean rule as the
 * sound), so agreement merges the strands and any difference winds them round each other.
 * Reduced motion: drawn once, still, at a quarter beat apart.
 */
export function ProofHelix({ beatsPerSec, label }: { beatsPerSec: number; label: string }) {
  const { state } = useAppState();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const palette = readPalette();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr);
    const strand = (phase: number, colour: string) => {
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const x = (i / STEPS) * WIDTH;
        const y = HEIGHT / 2 + Math.sin((i / STEPS) * TURNS * 2 * Math.PI + phase) * (HEIGHT / 2 - 4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    const draw = (beatPhase: number) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      strand(0, palette.moon);
      strand(beatPhase, palette.amber);
    };
    if (state.reduceMotion) {
      draw(beatsPerSec > 0 ? Math.PI / 2 : 0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      draw(2 * Math.PI * beatsPerSec * ((now - start) / 1000));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [beatsPerSec, state.reduceMotion]);

  return <canvas ref={ref} role="img" aria-label={label} style={{ width: WIDTH, height: HEIGHT }} className="max-w-full" />;
}
