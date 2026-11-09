"use client";

// ?debug=1 only: each open scene exposes what its chip shows and a way to move
// its needle, so the quick checks (values = JSON, warmest = grid max, ring
// count) can run against the real UI. Nothing here exists without the flag.

import { useEffect, useRef } from "react";
import type { SceneId } from "./registry";

export type DebugValue = string | number | boolean | null | DebugValue[] | { [key: string]: DebugValue };

export interface SceneDebug {
  id: SceneId;
  /** What the chip and card show now (numbers as read, before formatting). */
  read(): { [key: string]: DebugValue };
  /** Scene actions for the checks (move the needle, pick a month or year…). */
  act: { [name: string]: (...args: number[]) => DebugValue | void };
}

declare global {
  interface Window {
    __scene?: SceneDebug;
    __sceneFps?: number;
  }
}

export const sceneDebugOn = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

/** Publishes the scene's debug handle while it is open (the latest closures, through a ref). */
export function useSceneDebug(debug: SceneDebug): void {
  const ref = useRef(debug);
  useEffect(() => {
    ref.current = debug;
  });
  const { id } = debug;
  useEffect(() => {
    if (!sceneDebugOn()) return;
    window.__scene = { id, read: () => ref.current.read(), act: new Proxy({}, { get: (_, name: string) => ref.current.act[name] }) };
    return () => {
      if (window.__scene?.id === id) delete window.__scene;
    };
  }, [id]);
}
