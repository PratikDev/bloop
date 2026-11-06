"use client";

import { useEffect, type RefObject } from "react";
import { readPalette } from "@/lib/css-tokens";
import { START_CURSOR } from "@/lib/data";
import { createGlobeRenderer, type GlobeView } from "./renderer";

const DEG = Math.PI / 180;
const TURN_SECONDS = 140; // one slow turn
const DRAG_RADIANS_PER_PX = 0.006;
const MAX_TILT = 50 * DEG;
const INERTIA_DECAY = 0.92; // per frame, after a drag
/** The rings start where the map's cursor starts: the Bay of Bengal. */
const TARGET = { lat: START_CURSOR.lat * DEG, lon: START_CURSOR.lon * DEG };
const START_VIEW = { lon: START_CURSOR.lon * DEG, lat: 14 * DEG };

/** Whether this browser can draw the globe at all (checked once; the caller shows the flat frame if not). */
export function supportsWebGL(): boolean {
  try {
    return document.createElement("canvas").getContext("webgl") !== null;
  } catch {
    return false;
  }
}

/**
 * Draws the globe on `canvasRef`: a slow turn, drag to turn it (with a little
 * inertia), paused when off screen or the tab is hidden. With reduced motion
 * it is drawn once, facing the Bay of Bengal, and dragging still works.
 */
export function useGlobe(canvasRef: RefObject<HTMLCanvasElement | null>, image: HTMLImageElement | null, reduceMotion: boolean): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const renderer = createGlobeRenderer(canvas, image, readPalette(), TARGET);
    if (!renderer) return;

    const view: GlobeView = { ...START_VIEW, time: 0.6 };
    let velocity = 0;
    let drag: { x: number; y: number } | null = null;
    let visible = true;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag) {
        view.lon -= velocity + (reduceMotion ? 0 : (2 * Math.PI * dt) / TURN_SECONDS);
        velocity *= INERTIA_DECAY;
        if (Math.abs(velocity) < 1e-5) velocity = 0;
      }
      if (!reduceMotion) view.time += dt;
      renderer.draw(view);
      if (visible && !document.hidden && (!reduceMotion || velocity !== 0 || drag)) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(Math.round(canvas.clientWidth * dpr), Math.round(canvas.clientHeight * dpr));
      renderer.draw(view);
    };
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) wake();
    });
    seen.observe(canvas);

    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY };
      velocity = 0;
      wake();
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      view.lon -= dx * DRAG_RADIANS_PER_PX;
      view.lat = Math.max(-MAX_TILT, Math.min(MAX_TILT, view.lat + (e.clientY - drag.y) * DRAG_RADIANS_PER_PX));
      velocity = dx * DRAG_RADIANS_PER_PX;
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      drag = null;
      wake();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", wake);

    resize();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      sizeObserver.disconnect();
      seen.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", wake);
      renderer.dispose();
    };
  }, [canvasRef, image, reduceMotion]);
}
