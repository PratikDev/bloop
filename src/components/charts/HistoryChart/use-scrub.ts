"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

/** What a chart needs to be scrubbed: drag along it, or focus it and use the arrow keys. */
export interface ChartScrub {
  /** The month being heard, or null when nothing is scrubbed. */
  value: number | null;
  /** Accessible name of the chart as a slider. */
  label: string;
  /** What the slider announces for an index, e.g. "Mar 2015: +1.23 °C anomaly". */
  valueText(index: number): string;
  /** `source`: dragging (pointer) or a key, so the caller can pace the sound differently. */
  onChange(index: number, source: ScrubSource): void;
}

export type ScrubSource = "pointer" | "key";

/** Plot edges inside the chart box, in px (the y-axis sits on the left). */
export interface PlotInset {
  left: number;
  right: number;
}

const KEY_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -12, PageUp: 12 };

/**
 * Turns a chart box into a slider over `count` points. Pointer: the x position
 * picks the nearest point (horizontal drags only on touch, so the page still
 * scrolls vertically). Keys: arrows ±1, Page Up/Down ±12 (a year of months),
 * Home and End. onChange fires only when the index actually changes.
 */
export function useScrub(count: number, scrub: ChartScrub | undefined, inset: PlotInset) {
  const last = useRef<number | null>(null);
  if (!scrub) return {}; // a chart that isn't scrubbable stays a plain figure
  const change = (index: number, source: ScrubSource) => {
    const i = Math.min(count - 1, Math.max(0, index));
    if (i === last.current) return;
    last.current = i;
    scrub.onChange(i, source);
  };
  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const width = box.width - inset.left - inset.right;
    if (width <= 0) return;
    change(Math.round(((e.clientX - box.left - inset.left) / width) * (count - 1)), "pointer");
  };
  const current = scrub.value ?? 0;

  return {
    role: "slider",
    tabIndex: 0,
    "aria-label": scrub.label,
    "aria-valuemin": 0,
    "aria-valuemax": count - 1,
    "aria-valuenow": current,
    "aria-valuetext": scrub.value === null ? undefined : scrub.valueText(scrub.value),
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      e.currentTarget.setPointerCapture(e.pointerId);
      last.current = null; // a new press always sounds, even on the same month
      fromPointer(e);
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
    },
    onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      const step = KEY_STEPS[e.key];
      const target = step !== undefined ? current + step : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : null;
      if (target === null) return;
      e.preventDefault();
      last.current = scrub.value; // start from what's shown
      change(target, "key");
    },
  };
}
