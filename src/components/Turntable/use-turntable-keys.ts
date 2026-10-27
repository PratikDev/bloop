"use client";

import type { KeyboardEvent } from "react";
import type { Commands } from "../Commands/use-commands";
import { ARROWS, BIG_STEP_DEG, letterAction, STEP_DEG } from "../ExploreControls/use-map-keys";

export interface TurntableKeyActions {
  commands: Commands;
  nudge(dLat: number, dLon: number): void;
  toggleRotation(): void;
  speak(): void;
  stepRecord(step: 1 | -1): void;
  changeSpeed(step: 1 | -1): void;
  zoom(step: 1 | -1): void;
  focusSearch(): void;
  whereAmI(): void;
  bookmark(n: number): void;
  toggleTour(): void;
  toggleCamera(): void;
  stepOpacity(): void;
  toggleDetails(): void;
  focusDock(): void;
  /** Ends a running record-change animation; true if one was running. */
  skipAnimation(): boolean;
}

const ZOOM_IN = new Set(["+", "="]);
const ZOOM_OUT = new Set(["-", "_", "−"]);

/**
 * Keys while the turntable has focus. Turntable meanings (see Help) win over
 * the map's letters there: L (legend → Shift+L), T (Then vs Now → mode tabs),
 * 1–3 (tracks → R and the sleeves). I opens the details; Shift+D focuses the
 * dock (plain D keeps "describe"). Every other map letter keeps its meaning.
 * Esc is global; a tour, flight or open search claims it first.
 */
export function useTurntableKeys(a: TurntableKeyActions) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    a.skipAnimation();
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
  if (/^[1-9]$/.test(e.key)) return () => a.bookmark(Number(e.key));
  if (ZOOM_IN.has(e.key)) return () => a.zoom(1);
  if (ZOOM_OUT.has(e.key)) return () => a.zoom(-1);
  switch (e.key) {
    case " ":
      return a.toggleRotation;
    case "Enter":
      return a.speak;
    case "r":
    case "R":
      return () => a.stepRecord(e.shiftKey ? -1 : 1);
    case "[":
      return () => a.changeSpeed(-1);
    case "]":
      return () => a.changeSpeed(1);
    case "/":
    case "g":
    case "G":
      return a.focusSearch;
    case "l":
      return a.whereAmI;
    case "L":
      return a.commands.playLegend;
    case "t":
    case "T":
      return a.toggleTour;
    case "v":
    case "V":
      return a.toggleCamera;
    case "o":
    case "O":
      return a.stepOpacity;
    case "i":
    case "I":
      return a.toggleDetails;
    case "D":
      return e.shiftKey ? a.focusDock : null;
    default:
      return null;
  }
}
