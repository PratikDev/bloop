"use client";

import { useEffect, useState } from "react";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { describeNow, type DescribeInput, type FactsFor } from "./describe-now";

const SETTLE_MS = 250;

export function useDescribeInput(): DescribeInput | null {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { cursor, track, timelapse } = useShownPoint();
  if (!fields || (timelapse && !timelapse.held)) return null;
  return { fields, at: cursor, track, heldFrame: state.heldFrame };
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key, input?.fields]);
  return active ? facts : null;
}
