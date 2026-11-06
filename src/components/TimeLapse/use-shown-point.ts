"use client";

import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";
import { readAt, readingFromPoint, type Reading } from "@/lib/reading";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useStory } from "../Story/use-story";
import { useTimeLapse, type TimeLapseFrame } from "./use-time-lapse";

export interface ShownPoint {
  cursor: LatLon;
  reading: Reading | null;
  track: TrackMode;
  timelapse: TimeLapseFrame | null; // set while the time-lapse plays, or while the tour holds one of its frames
}

/**
 * What the map, readout and screen-reader label show: the latest frame at the
 * user's cursor (or where Story Mode points), or, during the time-lapse (and
 * while Story Mode holds one of its frames), that frame's value at the point
 * following the storm. One source, so they never disagree.
 */
export function useShownPoint(): ShownPoint {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { current } = useTimeLapse();
  const story = useStory();
  // Only while in Story mode, so leaving it shows the user's cursor in the same render.
  const focus = state.mode === "story" ? story.focus : null;
  const frame = current ?? focus?.frame;
  if (frame) return { cursor: frame.point, reading: readingFromPoint(frame.point), track: "rain", timelapse: frame };
  const { point, track } = focus ?? { point: state.cursor, track: state.track };
  return { cursor: point, reading: fields ? readAt(fields, point) : null, track, timelapse: null };
}
