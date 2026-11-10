"use client";

import { useEffect, useMemo, useRef, type PointerEvent } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
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

const PHONE_PAN = "(max-width: 639px)";
const DRAG_START_PX = 6;

/**
 * The EIC frame on a 2:1 equirectangular canvas, with the cursor and sound
 * rings on a second canvas. Click, tap or drag to move the cursor.
 * Decorative for assistive tech: the map region around it carries the text.
 * With `pan`, phones get a tall window that slides sideways to keep the needle in view; drag moves the needle.
 * `revealClassName` animates only the drawing (the opening's reveal), so the
 * click target stays whole while it plays.
 */
export function FrameView({ className, revealClassName, pan = false }: { className?: string; revealClassName?: string; pan?: boolean }) {
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
  const baseTrack = shown.track;

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

  // Phones: the map window shows a tall slice of the world and slides to keep the needle in view.
  const panning = useMediaQuery(PHONE_PAN) && pan;
  const windowRef = useRef<HTMLDivElement>(null);
  const view = useCanvasSize(windowRef);
  const drag = useRef<{ x: number; y: number; at: typeof shown.cursor; moved: boolean } | null>(null);
  const left = size && view ? Math.min(0, Math.max(view.width - size.width, view.width / 2 - ((shown.cursor.lon + 180) / 360) * size.width)) : 0;

  const moveTo = (e: PointerEvent<HTMLDivElement>) => {
    if (state.mode === "story") return; // the story moves the cursor
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch({ type: "setCursor", cursor: toLatLon(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height) });
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panning) drag.current = { x: e.clientX, y: e.clientY, at: state.cursor, moved: false };
    else moveTo(e);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (!panning) return moveTo(e);
    const from = drag.current;
    if (!from || state.mode === "story" || !size) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (!from.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    from.moved = true;
    dispatch({ type: "setCursor", cursor: { lat: from.at.lat + (dy / size.height) * 180, lon: from.at.lon - (dx / size.width) * 360 } });
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (panning && drag.current && !drag.current.moved) moveTo(e);
    drag.current = null;
  };

  const map = (
    <div
      ref={containerRef}
      style={panning ? { transform: `translateX(${left}px)` } : undefined}
      className={cn("relative touch-none select-none", panning ? "h-full w-max aspect-[2/1] transition-transform duration-(--duration-flip) ease-(--ease-mechanical) motion-reduce:transition-none" : "aspect-[2/1] w-full", className)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      aria-hidden="true"
    >
      <div className={cn("absolute inset-0", revealClassName)}>
        <canvas ref={baseRef} className="absolute inset-0 size-full" />
        <canvas ref={overlayRef} className="absolute inset-0 size-full" />
      </div>
    </div>
  );
  return panning ? (
    <div ref={windowRef} className="h-[60dvh] overflow-hidden">
      {map}
    </div>
  ) : (
    map
  );
}
