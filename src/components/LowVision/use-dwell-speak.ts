"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { FLAGS } from "@/lib/flags";
import { toLatLon } from "@/lib/geo";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

export const DWELL_MS = 600;
const STILL_PX = 4;

export function useDwellSpeak() {
  const { state } = useAppState();
  const { speakAt } = useCommands();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const on = FLAGS.lowVision && state.lowVision.speakDwell;
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);
  return {
    move(e: PointerEvent<HTMLElement>) {
      if (!on || e.pointerType === "touch") return;
      const p = { x: e.clientX, y: e.clientY };
      if (last.current && Math.hypot(p.x - last.current.x, p.y - last.current.y) < STILL_PX && timer.current) return;
      last.current = p;
      clear();
      const rect = e.currentTarget.getBoundingClientRect();
      const at = toLatLon(p.x - rect.left, p.y - rect.top, rect.width, rect.height);
      timer.current = setTimeout(() => speakAt(at), DWELL_MS);
    },
    leave() {
      clear();
      last.current = null;
    },
  };
}
