"use client";

import { useEffect, useRef, type PointerEvent, type RefObject } from "react";

const TAP_PX = 5;

export interface DragHandlers {
  /** Movement while a pointer is down, in CSS pixels. */
  onDrag(dx: number, dy: number): void;
  /** A click/tap that didn't move: position relative to the host, in CSS pixels. */
  onTap?(x: number, y: number): void;
  /** Wheel: > 1 zooms out, < 1 zooms in. */
  onZoom?(factor: number): void;
}

/** Pointer drag, tap and wheel on a scene's canvas host (wheel without scrolling the page). */
export function usePointerDrag(hostRef: RefObject<HTMLElement | null>, handlers: DragHandlers) {
  const live = useRef(handlers);
  const down = useRef<{ x: number; y: number; moved: number } | null>(null);
  useEffect(() => {
    live.current = handlers;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      live.current.onZoom?.(Math.exp(e.deltaY * 0.001));
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [hostRef]);

  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      e.currentTarget.setPointerCapture(e.pointerId);
      down.current = { x: e.clientX, y: e.clientY, moved: 0 };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const d = down.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      d.moved += Math.abs(dx) + Math.abs(dy);
      live.current.onDrag(dx, dy);
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const d = down.current;
      down.current = null;
      if (!d || d.moved > TAP_PX) return;
      const r = e.currentTarget.getBoundingClientRect();
      live.current.onTap?.(e.clientX - r.left, e.clientY - r.top);
    },
    onPointerCancel() {
      down.current = null;
    },
  };
}
