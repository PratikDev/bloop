"use client";

import { useEffect, useMemo, useRef, type PointerEvent } from "react";
import { cn } from "cn";
import { readPalette } from "@/lib/css-tokens";
import type { SstField } from "@/lib/data";
import { toLatLon } from "@/lib/geo";
import { readAt } from "@/lib/reading";
import { isVoiceAudible } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { buildLandLayer, drawBase } from "./base-layer";
import { prepareCanvas, useCanvasSize } from "./use-canvas-size";
import { useFrameImages } from "./use-frame-images";
import { useOverlayLoop, type OverlayInputs } from "./use-overlay-loop";

/**
 * The EIC frame on a 2:1 equirectangular canvas, with the cursor and sound
 * rings on a second canvas. Click, tap or drag to move the cursor.
 * Decorative for assistive tech: the map region around it carries the text.
 */
export function FrameView({ className }: { className?: string }) {
  const { state, dispatch } = useAppState();
  const { sst, fields } = useLiveData();
  const { sweepRef } = useCommands();
  const images = useFrameImages();
  const containerRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const landCache = useRef<{ sst: SstField; canvas: HTMLCanvasElement } | null>(null);
  const size = useCanvasSize(containerRef);

  // Static layer: redrawn only when the size, track or images change.
  useEffect(() => {
    const canvas = baseRef.current;
    if (!canvas || !size) return;
    const ctx = prepareCanvas(canvas, size);
    if (!ctx) return;
    const palette = readPalette();
    if (sst && landCache.current?.sst !== sst) landCache.current = { sst, canvas: buildLandLayer(sst, palette) };
    drawBase(ctx, state.track, { ...images, land: landCache.current?.canvas ?? null }, palette, size.width, size.height);
  }, [size, state.track, images, sst]);

  const overlayInputs = useMemo<OverlayInputs>(() => {
    const reading = fields ? readAt(fields, state.cursor) : null;
    const rainAudible = isVoiceAudible(state, "rain") || isVoiceAudible(state, "snow");
    return {
      cursor: state.cursor,
      oceanC: reading && isVoiceAudible(state, "ocean") ? reading.ocean.valueC : null,
      rainMm: reading && rainAudible ? reading.rain.mmPerHour : null,
      reduceMotion: state.reduceMotion,
    };
  }, [fields, state]);
  useOverlayLoop(overlayRef, size, overlayInputs, sweepRef);

  const moveTo = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch({ type: "setCursor", cursor: toLatLon(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height) });
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-[2/1] w-full touch-none select-none", className)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        moveTo(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) moveTo(e);
      }}
      aria-hidden="true"
    >
      <canvas ref={baseRef} className="absolute inset-0 size-full" />
      <canvas ref={overlayRef} className="absolute inset-0 size-full" />
    </div>
  );
}
