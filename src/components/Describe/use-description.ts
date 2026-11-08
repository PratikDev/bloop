"use client";

import { useEffect, useState } from "react";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { describeNow, type DescribeInput, type FactsFor } from "./describe-now";

/** Waits this long after the needle stops before describing again (the status region's own debounce). */
const SETTLE_MS = 250;

/** The input for a description of the needle as the map shows it now (null until the frames load, or during a run). */
export function useDescribeInput(): DescribeInput | null {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { cursor, track, timelapse } = useShownPoint();
  // A playing time-lapse or the story's frames are not the needle's: only the live map or a held frame is described.
  if (!fields || (timelapse && !timelapse.held)) return null;
  return { fields, at: cursor, track, heldFrame: state.heldFrame };
}

/** The Description panel's facts, following the needle (only while `active`, so nothing loads before it is opened). */
export function useDescription(active: boolean): FactsFor | null {
  const input = useDescribeInput();
  const [facts, setFacts] = useState<FactsFor | null>(null);
  const key = input ? `${input.at.lat},${input.at.lon},${input.track},${input.heldFrame}` : null;
  useEffect(() => {
    if (!active || !input) return;
    let cancelled = false;
    const id = setTimeout(() => {
      void describeNow(input).then((f) => {
        if (!cancelled) setFacts(() => f);
      });
    }, SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // The key holds what the input is made of (the fields object changes only with a new frame, which reloads the page's data).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key, input?.fields]);
  return active ? facts : null;
}
