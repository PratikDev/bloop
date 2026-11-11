"use client";

import { useEffect, useRef, useState } from "react";
import { readPalette } from "@/lib/css-tokens";
import { useAppState } from "../../AppState/use-app-state";
import { useFrameImages } from "../../FrameView/use-frame-images";
import { useLiveData } from "../../LiveData/use-live-data";
import type { Turntable } from "../use-turntable";
import { createDeckView, type DeckView } from "./deck-view";
import { drawBloopLabel } from "./record-texture";
import { useDeckHardware, type DeckControls } from "./use-deck-hardware";
import { useDeckLevels } from "./use-deck-levels";
import { useRecordPointer } from "./use-record-pointer";

/** The mounted deck view and its canvas, for the debug hook (debug.ts). */
export const deckProbe: { view: DeckView | null; canvas: HTMLCanvasElement | null } = { view: null, canvas: null };

declare global {
  interface Window {
    /** With ?debug=1: the deck view and its canvas, for the hardware checks. */
    __deck?: { view: DeckView; canvas: HTMLCanvasElement };
  }
}

/** The most the deck draws at: its lines stay crisp and the GPU has the globe to draw too. */
const MAX_DPR = 2;

/**
 * The turntable beside the globe: its own canvas, drawn on the globe's frame (the Turntable's frame loop, paused when
 * hidden). Decorative: the needle's place and value are in the readout and the hidden description.
 */
export function DeckViewCanvas({ tt, controls, motionPaused }: { tt: Turntable; controls: DeckControls; motionPaused: boolean }) {
  const { subscribe } = tt;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<DeckView | null>(null);
  useDeckHardware(view, canvasRef, controls);
  useDeckLevels(view, canvasRef, motionPaused);
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { sst, rain } = useFrameImages();

  // The record's grooves are this frame's data, redrawn when the record (track) or the data changes.
  useEffect(() => {
    if (!view || !fields) return;
    view.setRecord(fields, state.track, { sst, rain });
  }, [view, fields, state.track, sst, rain]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = readPalette();
    const view = createDeckView(canvas, palette);
    setView(view);
    const label = document.createElement("canvas");
    drawBloopLabel(label, palette);
    view.setLabel(label);
    deckProbe.view = view;
    deckProbe.canvas = canvas;
    if (new URLSearchParams(window.location.search).get("debug") === "1") window.__deck = { view, canvas };
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
      setView(null);
      deckProbe.view = null;
      deckProbe.canvas = null;
      delete window.__deck;
    };
  }, [subscribe]);
  useRecordPointer(canvasRef, view, tt);
  return <canvas ref={canvasRef} aria-hidden="true" className="block size-full touch-none" />;
}
