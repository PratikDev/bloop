"use client";

import { useRef, type PointerEvent } from "react";
import type { Turntable } from "./use-turntable";

const CLICK_SLOP_PX = 5; // less movement than this is a click, not a drag
const DEG_PER_WIDTH = 180; // dragging across the whole view turns the globe half a turn

/** Drag to turn the globe; click or tap to bring that point under the needle. */
export function useGlobePointer(tt: Turntable) {
  const drag = useRef<{ x: number; y: number; lon: number; moved: boolean } | null>(null);
  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, lon: tt.needle().lon, moved: false };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.hypot(dx, e.clientY - d.y) < CLICK_SLOP_PX) return;
      d.moved = true;
      // Dragging right carries the front of the globe right: points from the west reach the needle.
      tt.turnTo(d.lon - (dx / e.currentTarget.clientWidth) * DEG_PER_WIDTH);
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const d = drag.current;
      drag.current = null;
      if (d?.moved) {
        tt.moveTo(tt.needle()); // settle the app cursor where the drag ended
        return;
      }
      const hit = tt.pickAt(e.clientX, e.clientY);
      if (hit) tt.moveTo(hit);
    },
    onPointerCancel() {
      drag.current = null;
    },
  };
}
