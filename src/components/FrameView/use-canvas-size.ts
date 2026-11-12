"use client";

import { useEffect, useState, type RefObject } from "react";

export interface CanvasSize {
  width: number; // CSS pixels
  height: number;
  dpr: number;
}

/** Tracks an element's CSS size and the device pixel ratio, for sharp canvases. */
export function useCanvasSize(ref: RefObject<HTMLElement | null>): CanvasSize | null {
  const [size, setSize] = useState<CanvasSize | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height, dpr: window.devicePixelRatio || 1 });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * Sizes a canvas's backing store for the pixel ratio and clears it; drawing then uses CSS pixels. Resizing alone
 * clears only when the size changes, so a redraw at the same size (low vision turned off) would keep the last picture.
 */
export function prepareCanvas(canvas: HTMLCanvasElement, size: CanvasSize): CanvasRenderingContext2D | null {
  const w = Math.round(size.width * size.dpr);
  const h = Math.round(size.height * size.dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(1, 0, 0, 1, 0, 0);
  ctx?.clearRect(0, 0, w, h);
  ctx?.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  return ctx;
}
