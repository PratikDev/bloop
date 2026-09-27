"use client";

import type { KeyboardEvent } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import type { Commands } from "../Commands/use-commands";

const STEP_DEG = 1;
const BIG_STEP_DEG = 10;

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [1, 0],
  ArrowDown: [-1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const TRACK_KEYS: Record<string, TrackMode> = { "1": "ocean", "2": "rain", "3": "both" };

/**
 * Keys that only work while the map region has focus (plan §9.3), so single
 * letters never clash with screen reader navigation (WCAG 2.1.4).
 * Esc is handled globally, not here. G is reserved for the game.
 */
export function useMapKeys(commands: Commands) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const arrow = ARROWS[e.key];
    if (arrow) {
      const step = e.shiftKey ? BIG_STEP_DEG : STEP_DEG;
      commands.moveCursor(arrow[0] * step, arrow[1] * step);
    } else if (TRACK_KEYS[e.key]) {
      commands.setTrack(TRACK_KEYS[e.key]);
    } else {
      const action = letterAction(commands, e.key);
      if (!action) return;
      action();
    }
    e.preventDefault();
  };
}

function letterAction(c: Commands, key: string): (() => void) | null {
  switch (key.toLowerCase()) {
    case "enter":
      return c.speakCurrent;
    case " ":
      return c.togglePlaying;
    case "s":
      return c.playSweep;
    case "m":
      return () => c.toggleSetting("allMuted");
    case "d":
      return () => c.toggleSetting("describe");
    case "c":
      return () => c.toggleSetting("captions");
    case "t":
      return () => c.setMode("thenNow");
    case "l":
      return c.playLegend;
    case "p":
      return () => c.openPanel("provenance");
    case "x":
      return c.xray;
    case "h":
    case "?":
      return c.openHelp;
    default:
      return null;
  }
}
