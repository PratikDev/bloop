"use client";

import type { KeyboardEvent } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import type { Commands } from "../Commands/use-commands";
import { ARROWS, BIG_STEP_DEG, letterAction, STEP_DEG, TRACK_KEYS } from "../ExploreControls/use-map-keys";

export interface TurntableKeyActions {
  commands: Commands;
  nudge(dLat: number, dLon: number): void;
  toggleRotation(): void;
  speak(): void;
  selectRecord(track: TrackMode): void;
  stepRecord(step: 1 | -1): void;
  changeSpeed(step: 1 | -1): void;
}

const FASTER = new Set(["+", "="]);
const SLOWER = new Set(["-", "_", "−"]);

/**
 * Keys while the turntable has focus. Arrows, Space, Enter, R, 1–3 and +/−
 * are the turntable's; every other map letter (H, M, D, C, L, P, X, S, T)
 * keeps its meaning. Esc is global (stop all, back to the flat map).
 */
export function useTurntableKeys(a: TurntableKeyActions) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const action = turntableAction(a, e) ?? letterAction(a.commands, e.key);
    if (!action) return;
    action();
    e.preventDefault();
  };
}

function turntableAction(a: TurntableKeyActions, e: KeyboardEvent<HTMLElement>): (() => void) | null {
  const arrow = ARROWS[e.key];
  if (arrow) {
    const step = e.shiftKey ? BIG_STEP_DEG : STEP_DEG;
    return () => a.nudge(arrow[0] * step, arrow[1] * step);
  }
  const track = TRACK_KEYS[e.key];
  if (track) return () => a.selectRecord(track);
  if (FASTER.has(e.key)) return () => a.changeSpeed(1);
  if (SLOWER.has(e.key)) return () => a.changeSpeed(-1);
  switch (e.key) {
    case " ":
      return a.toggleRotation;
    case "Enter":
      return a.speak;
    case "r":
    case "R":
      return () => a.stepRecord(e.shiftKey ? -1 : 1);
    default:
      return null;
  }
}
