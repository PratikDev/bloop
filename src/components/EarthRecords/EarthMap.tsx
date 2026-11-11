"use client";

import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import type { LatLon } from "@/lib/data";
import { clampLat, wrapLon } from "@/lib/data/grid";
import type { Box } from "@/lib/earth/class-grid";

const STEP_DEG = 1;
const SHIFT_STEP_DEG = 5;

export interface MapBox {
  id: string;
  box: Box;
  current: boolean;
}

/**
 * A whole-Earth picture (equirectangular, 2:1: a shipped .webp, or a class grid drawn by the caller) with the needle
 * on top and, when given, outlined boxes. One Tab stop: arrow keys move the needle (Shift: further), a click or tap
 * places it. The caller's label is its accessible name (alt text and the needle's reading).
 */
export function EarthMap({ image, label, needle, onMove, boxes = [], children, testId }: { image?: string; label: string; needle: LatLon; onMove(to: LatLon): void; boxes?: readonly MapBox[]; children?: ReactNode; testId?: string }) {
  const x = (lon: number) => ((lon + 180) / 360) * 100;
  const y = (lat: number) => ((90 - lat) / 180) * 100;

  function pick(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    onMove({ lat: clampLat(90 - ((e.clientY - r.top) / r.height) * 180), lon: wrapLon(-180 + ((e.clientX - r.left) / r.width) * 360) });
  }

  function key(e: KeyboardEvent<HTMLDivElement>) {
    const d: Record<string, [number, number]> = { ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    const step = e.shiftKey ? SHIFT_STEP_DEG : STEP_DEG;
    onMove({ lat: clampLat(needle.lat + m[0] * step), lon: wrapLon(needle.lon + m[1] * step) });
  }

  return (
    <div
      role="img"
      tabIndex={0}
      aria-label={label}
      onPointerDown={pick}
      onKeyDown={key}
      data-testid={testId}
      data-needle={`${needle.lat.toFixed(2)},${needle.lon.toFixed(2)}`}
      className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-land ring-1 ring-glass-edge focus-visible:outline-2 focus-visible:outline-moon"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export with no image optimiser; the picture is data */}
      {image && <img src={image} alt="" aria-hidden="true" className="absolute inset-0 size-full object-fill" draggable={false} />}
      {children}
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
        {boxes.map((b) => (
          <rect
            key={b.id}
            x={x(b.box[0])}
            y={y(b.box[3])}
            width={x(b.box[2]) - x(b.box[0])}
            height={y(b.box[1]) - y(b.box[3])}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={b.current ? 2.5 : 1.25}
            strokeDasharray={b.current ? undefined : "3 2"}
            className="stroke-moon"
          />
        ))}
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-moon bg-night/40 shadow-float"
        style={{ left: `${x(needle.lon)}%`, top: `${y(needle.lat)}%` }}
      />
    </div>
  );
}
