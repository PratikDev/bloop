"use client";

import { useEffect, useRef } from "react";
import { readPalette } from "@/lib/css-tokens";
import type { Turntable } from "../use-turntable";
import { createDeckView, type DeckView } from "./deck-view";

/** The mounted deck view and its canvas, for the debug hook (debug.ts). */
export const deckProbe: { view: DeckView | null; canvas: HTMLCanvasElement | null } = { view: null, canvas: null };

/** The most the deck draws at: its lines stay crisp and the GPU has the globe to draw too. */
const MAX_DPR = 2;

/**
 * The turntable beside the globe: its own canvas, drawn on the globe's frame (the Turntable's frame loop, paused when
 * hidden). Decorative: the needle's place and value are in the readout and the hidden description.
 */
export function DeckViewCanvas({ subscribe }: { subscribe: Turntable["subscribe"] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = createDeckView(canvas, readPalette());
    deckProbe.view = view;
    deckProbe.canvas = canvas;
    const size = () => view.resize(canvas.clientWidth, canvas.clientHeight, Math.min(MAX_DPR, window.devicePixelRatio || 1));
    const observer = new ResizeObserver(size);
    observer.observe(canvas);
    size();
    const off = subscribe((info) => {
      if (info.pose) view.update(info.pose);
    });
    return () => {
      off();
      observer.disconnect();
      view.dispose();
      deckProbe.view = null;
      deckProbe.canvas = null;
    };
  }, [subscribe]);
  return <canvas ref={canvasRef} aria-hidden="true" className="block size-full" />;
}
