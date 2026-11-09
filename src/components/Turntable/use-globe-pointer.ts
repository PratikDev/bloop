"use client";

import { useRef, type PointerEvent } from "react";
import type { Turntable } from "./use-turntable";

const CLICK_SLOP_PX = 5; // less movement than this is a click, not a drag
const WHEEL_ZOOM = 0.0015;
/** Degrees per pixel of drag across the view height, per globe radius of camera height above the surface. */
const DRAG_DEG = 60;

/**
 * Drag to turn the globe (in the close-up view, up/down drags move the needle's
 * latitude too, slower when zoomed in); click or tap to bring a point under the
 * needle; wheel or pinch to zoom.
 */
export function useGlobePointer(tt: Turntable) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; lat: number; lon: number; moved: boolean } | null>(null);
  const pinch = useRef<number | null>(null);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : null;
  };

  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      tt.skipAnimation();
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        pinch.current = spread();
        drag.current = null;
        return;
      }
      const at = tt.needle();
      drag.current = { x: e.clientX, y: e.clientY, lat: at.lat, lon: at.lon, moved: false };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch.current !== null) {
        const now = spread();
        if (now && pinch.current) tt.zoomBy(pinch.current / now);
        pinch.current = now;
        return;
      }
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < CLICK_SLOP_PX) return;
      d.moved = true;
      const height = Math.max(1, e.currentTarget.clientHeight);
      const close = tt.cameraMode === "explore";
      const degPerPx = (DRAG_DEG * Math.max(0.05, tt.distance() - 1)) / height;
      // Dragging right carries the front of the globe right: points from the west reach the needle.
      tt.turnTo({ lat: close ? d.lat + dy * degPerPx : d.lat, lon: d.lon - dx * (close ? degPerPx : 180 / e.currentTarget.clientWidth) });
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      pointers.current.delete(e.pointerId);
      if (pinch.current !== null) {
        if (pointers.current.size < 2) pinch.current = null;
        return;
      }
      const d = drag.current;
      drag.current = null;
      if (d?.moved) {
        tt.moveTo(tt.needle()); // settle the app cursor where the drag ended
        return;
      }
      const hit = tt.pickAt(e.clientX, e.clientY);
      if (hit) tt.moveTo(hit);
    },
    onPointerCancel(e: PointerEvent<HTMLElement>) {
      pointers.current.delete(e.pointerId);
      drag.current = null;
      pinch.current = null;
    },
  };
}

/** Wheel zoom; attached natively (not passive) by the stage so the page doesn't scroll meanwhile. */
export function wheelZoom(tt: Turntable, e: { deltaY: number }) {
  tt.zoomBy(Math.exp(e.deltaY * WHEEL_ZOOM));
}
