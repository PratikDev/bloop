"use client";

import { useRef, type PointerEvent } from "react";
import type { Turntable } from "./use-turntable";

const CLICK_SLOP_PX = 6; // less movement than this is a click (a selection), not a drag
const WHEEL_ZOOM = 0.0015;
/** Degrees per pixel of drag across the view height, per globe radius of camera height above the surface. */
const DRAG_DEG = 60;

/**
 * Click or tap the globe to select a place: the arm swings to its groove on the record, both turn to bring it under the
 * needle, the needle drops. Drag to look around: the view turns, the needle and what's playing don't. A mouse hovering
 * over the globe previews the point under it in the readout (silent; not on touch). Wheel or pinch to zoom.
 */
export function useGlobePointer(tt: Turntable) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; lastX: number; moved: boolean } | null>(null);
  const pinch = useRef<number | null>(null);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : null;
  };

  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      tt.skipAnimation();
      // The preview stays through the press: a click turns it into the pick at once (no frame of the old place between).
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        tt.setPreview(null);
        pinch.current = spread();
        drag.current = null;
        return;
      }
      drag.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, moved: false };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (!pointers.current.has(e.pointerId)) {
        // A mouse over the globe, no button: preview the point under it.
        if (e.pointerType === "mouse" && e.buttons === 0) tt.setPreview(tt.pickAt(e.clientX, e.clientY));
        return;
      }
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
      if (!d.moved) tt.setPreview(null); // a drag looks around: no point is previewed
      d.moved = true;
      const close = tt.cameraMode === "explore";
      const degPerPx = close ? (DRAG_DEG * Math.max(0.05, tt.distance() - 1)) / Math.max(1, e.currentTarget.clientHeight) : 180 / Math.max(1, e.currentTarget.clientWidth);
      // Dragging right carries the front of the globe right. Only the view turns: the needle and the record stay.
      tt.look((e.clientX - d.lastX) * degPerPx);
      d.lastX = e.clientX;
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      pointers.current.delete(e.pointerId);
      if (pinch.current !== null) {
        if (pointers.current.size < 2) pinch.current = null;
        return;
      }
      const d = drag.current;
      drag.current = null;
      if (d?.moved) return;
      const hit = tt.pickAt(e.clientX, e.clientY);
      tt.setPreview(null);
      if (hit) tt.pick(hit);
    },
    onPointerLeave(e: PointerEvent<HTMLElement>) {
      if (e.pointerType === "mouse") tt.setPreview(null);
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
