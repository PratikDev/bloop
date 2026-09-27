"use client";

import { useEffect, useMemo, useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { readPalette } from "@/lib/css-tokens";
import type { SstField } from "@/lib/data";
import { toLatLon } from "@/lib/geo";
import { isVoiceAudible } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { buildLandLayer, drawBase } from "./base-layer";
import { prepareCanvas, useCanvasSize } from "./use-canvas-size";
import { useFrameImages } from "./use-frame-images";
import { useOverlayLoop, type OverlayInputs } from "./use-overlay-loop";

/**
 * The EIC frame on a 2:1 equirectangular canvas, with the cursor and sound
 * rings on a second canvas. Click, tap or drag to move the cursor.
 * Decorative for assistive tech: the map region around it carries the text.
 * `revealClassName` animates only the drawing (the opening's reveal), so the
 * click target stays whole while it plays.
 */
export function FrameView({ className, revealClassName }: { className?: string; revealClassName?: string }) {
  const { state, dispatch } = useAppState();
  const { sst } = useLiveData();
  const { sweepRef } = useCommands();
  const images = useFrameImages();
  const containerRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const landCache = useRef<{ sst: SstField; canvas: HTMLCanvasElement } | null>(null);
  const size = useCanvasSize(containerRef);

  const shown = useShownPoint();
  // During the time-lapse the base shows that frame's own image, in the rain style.
  const frameImage = shown.timelapse?.image ?? null;
  const baseTrack = shown.timelapse ? "rain" : state.track;

  // Static layer: redrawn only when the size, track or images change (each frame, during the time-lapse).
  useEffect(() => {
    const canvas = baseRef.current;
    if (!canvas || !size) return;
    const ctx = prepareCanvas(canvas, size);
    if (!ctx) return;
    const palette = readPalette();
    if (sst && landCache.current?.sst !== sst) landCache.current = { sst, canvas: buildLandLayer(sst, palette) };
    const shownImages = { ...images, rain: frameImage ?? images.rain, land: landCache.current?.canvas ?? null };
    drawBase(ctx, baseTrack, shownImages, palette, size.width, size.height);
  }, [size, baseTrack, images, frameImage, sst]);

  const overlayInputs = useMemo<OverlayInputs>(() => {
    const { reading, cursor, timelapse } = shown;
    const rainAudible = timelapse ? state.soundOn : isVoiceAudible(state, "rain") || isVoiceAudible(state, "snow");
    return {
      cursor,
      oceanC: reading && !timelapse && isVoiceAudible(state, "ocean") ? reading.ocean.valueC : null,
      rainMm: reading && rainAudible ? reading.rain.mmPerHour : null,
      reduceMotion: state.reduceMotion,
    };
  }, [shown, state]);
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
      <div className={cn("absolute inset-0", revealClassName)}>
        <canvas ref={baseRef} className="absolute inset-0 size-full" />
        <canvas ref={overlayRef} className="absolute inset-0 size-full" />
      </div>
    </div>
  );
}
