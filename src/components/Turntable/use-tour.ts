"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sleep } from "@/lib/abortable";
import { pushEscapeHandler } from "@/lib/escape";
import type { StoryPlace } from "@/lib/geo/types";

const DWELL_MS = 2500;

export interface TourSteps {
  stops: StoryPlace[];
  /** Flies to a stop; resolves false if the flight was interrupted. */
  fly(stop: StoryPlace): Promise<boolean>;
  /** Announces which stop this is. */
  arrive(stop: StoryPlace, index: number, total: number): void;
  /** Speaks the value there (resolves when said). */
  speak(): Promise<void>;
  stopped(): void;
  done(): void;
}

/** A gentle tour of the story places: fly, speak the value from the grid, pause, next. T or Esc stops it. */
export function useTour(steps: TourSteps | null): { touring: boolean; toggle(): void; stop(): void } {
  const [touring, setTouring] = useState(false);
  const run = useRef(0);
  const latest = useRef(steps);
  useEffect(() => {
    latest.current = steps;
  });

  const stop = useCallback(() => {
    if (!touring) return;
    run.current++;
    setTouring(false);
    latest.current?.stopped();
  }, [touring]);

  const start = useCallback(async () => {
    const s = latest.current;
    if (!s || s.stops.length === 0) return;
    const id = ++run.current;
    setTouring(true);
    for (let i = 0; i < s.stops.length; i++) {
      const stopAt = s.stops[i];
      s.arrive(stopAt, i + 1, s.stops.length);
      const arrived = await s.fly(stopAt);
      if (id !== run.current) return;
      if (!arrived) {
        // The user took over mid-flight (dragged, pressed a key): the tour ends there.
        run.current++;
        setTouring(false);
        s.stopped();
        return;
      }
      await s.speak();
      if (id !== run.current) return;
      await sleep(DWELL_MS);
      if (id !== run.current) return;
    }
    setTouring(false);
    s.done();
  }, []);

  useEffect(() => {
    if (!touring) return;
    return pushEscapeHandler(() => {
      stop();
      return true;
    });
  }, [touring, stop]);

  return { touring, toggle: () => (touring ? stop() : void start()), stop };
}
