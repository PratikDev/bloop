"use client";

import { createContext, useContext } from "react";
import type { SweepPoint } from "@/lib/audio-adapter/types";

export type TimeLapseStatus = "idle" | "loading" | "playing" | "error";

/** The frame on screen while the time-lapse plays. */
export interface TimeLapseFrame {
  index: number;
  total: number;
  timeUtc: string; // this frame's own time (index.json)
  point: SweepPoint; // where the cursor is (the heaviest rain nearby) and its value
  image: HTMLImageElement | null;
}

/** How a run ended, and its heaviest frame (for Story Mode's narration). */
export interface TimeLapseRun {
  finished: boolean; // false = stopped, failed to load, or already running
  peak: { point: SweepPoint; timeUtc: string } | null;
  last: SweepPoint | null; // where the storm-following ended (the newest frame)
}

export interface TimeLapseValue {
  status: TimeLapseStatus;
  progress: { loaded: number; total: number } | null;
  current: TimeLapseFrame | null;
  /** Loads the frames (first time only), plays them, and resolves when the run ends. */
  start(): Promise<TimeLapseRun>;
  stop(): void;
}

export const TimeLapseContext = createContext<TimeLapseValue | null>(null);

export function useTimeLapse(): TimeLapseValue {
  const value = useContext(TimeLapseContext);
  if (!value) throw new Error("useTimeLapse must be used inside <TimeLapseProvider>");
  return value;
}
