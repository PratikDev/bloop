"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { LatLon, OfficialGrid } from "@/lib/data";
import { stepImage } from "./colours";

const KEY_STEP_CELLS = 1;

/**
 * The record's map layer at one time step, at its own grid size (scaled up, pixelated), with the needle on top.
 * Click or tap moves the needle; arrow keys move it one cell. The description is the caller's (aria-label).
 */
export function RecordMap({ grid, step, needle, onMove, label }: { grid: OfficialGrid; step: number; needle: LatLon; onMove(to: LatLon): void; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width, height, bounds } = grid.layer.grid;
  const [west, south, east, north] = bounds;
  const cellLat = (north - south) / height;
  const cellLon = (east - west) / width;

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    const img = stepImage(grid, step);
    if (ctx && img) ctx.putImageData(img, 0, 0);
  }, [grid, step]);

  function pick(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    onMove({ lat: north - ((e.clientY - r.top) / r.height) * (north - south), lon: west + ((e.clientX - r.left) / r.width) * (east - west) });
  }

  function key(e: KeyboardEvent<HTMLCanvasElement>) {
    const d: Record<string, [number, number]> = { ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    onMove({ lat: Math.min(north, Math.max(south, needle.lat + m[0] * KEY_STEP_CELLS * cellLat)), lon: needle.lon + m[1] * KEY_STEP_CELLS * cellLon });
  }

  const x = ((needle.lon - west) / (east - west)) * 100;
  const y = ((north - needle.lat) / (north - south)) * 100;
  return (
    <div className="relative w-full bg-land" style={{ aspectRatio: `${(east - west) / (north - south)}` }}>
      <canvas
        ref={canvas}
        width={width}
        height={height}
        role="img"
        tabIndex={0}
        aria-label={label}
        onPointerDown={pick}
        onKeyDown={key}
        className="absolute inset-0 size-full [image-rendering:pixelated] focus-visible:outline-2 focus-visible:outline-moon"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-moon bg-night/40"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </div>
  );
}
