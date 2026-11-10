"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { LatLon } from "@/lib/data";
import type { Turntable } from "../use-turntable";
import type { DeckView } from "./deck-view";

type Needle = Pick<Turntable, "pick" | "setPreview" | "hold" | "skipAnimation">;

/**
 * Pressing on the record's grooves cues it by hand: the needle lifts (silent) and the readout previews the point under
 * the pointer (radius gives latitude, angle gives longitude); releasing drops the needle there, with the same swing as a
 * click on the globe. A click is a press and release in one place. Touch works the same.
 */
export function useRecordPointer(canvasRef: RefObject<HTMLCanvasElement | null>, view: DeckView | null, needle: Needle): void {
  // The Turntable object is new on every render (a preview re-renders it): read the latest, so a drag survives.
  const latest = useRef(needle);
  useEffect(() => {
    latest.current = needle;
  });
  useEffect(() => {
    const tt = () => latest.current;
    const canvas = canvasRef.current;
    if (!canvas || !view) return;
    let held: LatLon | null = null;
    const pickAt = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return view.pick(e.clientX - box.left, e.clientY - box.top);
    };
    const down = (e: PointerEvent) => {
      const at = pickAt(e);
      if (!at) return;
      tt().skipAnimation();
      canvas.setPointerCapture(e.pointerId);
      held = at;
      tt().hold(true);
      tt().setPreview(at);
    };
    const move = (e: PointerEvent) => {
      const at = pickAt(e);
      if (!held) {
        canvas.style.cursor = at ? "pointer" : "";
        return;
      }
      if (at) {
        held = at;
        tt().setPreview(at);
      }
    };
    const up = () => {
      if (!held) return;
      const at = held;
      held = null;
      tt().setPreview(null);
      tt().pick(at);
    };
    const cancel = () => {
      if (!held) return;
      held = null;
      tt().setPreview(null);
      tt().hold(false);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
    };
  }, [canvasRef, view]);
}
