"use client";

import { createContext, useContext } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";

export type StoryStepId = "hum" | "sweep" | "storm" | "whisper" | "xray" | "truth";
export type StoryStatus = "idle" | "playing" | "finished";

/** Where Story Mode points the map: today's frames at this point, on this track. */
export interface StoryFocus {
  point: LatLon;
  track: TrackMode;
}

/** The line being narrated, and the dataset it names (the satellite whisper). */
export interface StoryLine {
  text: string;
  source: string | null; // the full dataset name(s)
}

export interface StoryValue {
  status: StoryStatus;
  step: StoryStepId | null;
  line: StoryLine | null;
  focus: StoryFocus | null;
  replay(): void;
  exit(): void;
}

export const StoryContext = createContext<StoryValue | null>(null);

export function useStory(): StoryValue {
  const value = useContext(StoryContext);
  if (!value) throw new Error("useStory must be used inside <StoryProvider>");
  return value;
}
