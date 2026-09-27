"use client";

import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";
import { readAt, readingFromPoint, type Reading } from "@/lib/reading";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useTimeLapse, type TimeLapseFrame } from "./use-time-lapse";

export interface ShownPoint {
  cursor: LatLon;
  reading: Reading | null;
  track: TrackMode;
  timelapse: TimeLapseFrame | null; // set while the time-lapse plays
}

/**
 * What the map, readout and screen-reader label show: today's frame at the
 * user's cursor, or, during the time-lapse, that frame's value at the point
 * following the storm. One source, so they never disagree.
 */
export function useShownPoint(): ShownPoint {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { current } = useTimeLapse();
  if (current) return { cursor: current.point, reading: readingFromPoint(current.point), track: "rain", timelapse: current };
  return { cursor: state.cursor, reading: fields ? readAt(fields, state.cursor) : null, track: state.track, timelapse: null };
}
