"use client";

import { useEffect, useRef, type RefObject } from "react";
import { startGlobe, type GlobeControl, type GlobeOptions } from "./controller";

/** Whether this browser can draw the globe at all (checked once; the caller shows the flat frame if not). */
export function supportsWebGL(): boolean {
  try {
    return document.createElement("canvas").getContext("webgl") !== null;
  } catch {
    return false;
  }
}

/**
 * Draws the globe on `canvasRef` once there are frames to show, and feeds later changes to the same
 * renderer: new frames, focus and ring colour never re-create it. `dataKey` changing means the data arrived.
 */
export function useGlobe(canvasRef: RefObject<HTMLCanvasElement | null>, options: GlobeOptions, dataKey: unknown): void {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const control = useRef<GlobeControl | null>(null);
  const hasImages = options.images.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasImages) return;
    const started = startGlobe(canvas, () => latest.current);
    control.current = started;
    return () => {
      started?.dispose();
      control.current = null;
    };
  }, [canvasRef, hasImages]);

  const { images, focus, ringColor, pulseKey, paused, autoTurn, reduceMotion } = options;
  const focusLat = focus?.lat;
  const focusLon = focus?.lon;

  // Skips the first run of each: the renderer started with these values.
  const seen = useRef({ images, focusLat, focusLon, pulseKey, dataKey });
  useEffect(() => {
    if (seen.current.images === images) return;
    seen.current.images = images;
    if (hasImages) control.current?.setImages(images);
    control.current?.report();
  }, [images, hasImages]);
  useEffect(() => {
    if (seen.current.focusLat === focusLat && seen.current.focusLon === focusLon) return;
    seen.current.focusLat = focusLat;
    seen.current.focusLon = focusLon;
    control.current?.setFocus(focusLat !== undefined && focusLon !== undefined ? { lat: focusLat, lon: focusLon } : null);
  }, [focusLat, focusLon]);
  useEffect(() => {
    if (ringColor) control.current?.setRing(ringColor);
  }, [ringColor, hasImages]);
  useEffect(() => {
    if (seen.current.pulseKey === pulseKey) return;
    seen.current.pulseKey = pulseKey;
    control.current?.pulse();
  }, [pulseKey]);
  useEffect(() => {
    if (seen.current.dataKey === dataKey) return;
    seen.current.dataKey = dataKey;
    control.current?.report();
  }, [dataKey]);
  useEffect(() => {
    control.current?.wake();
  }, [paused, autoTurn, reduceMotion]);
}
