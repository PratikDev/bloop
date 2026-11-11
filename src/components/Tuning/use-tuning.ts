"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerHandle } from "@/lib/audio-adapter/types";
import { useFreshness } from "@/hooks/use-freshness";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { tuningSteps, type TuningStep } from "./steps";

export interface Tuning {
  steps: TuningStep[];
  index: number;
  step: TuningStep;
  /** Says the step again, then plays its sound again. */
  again(): void;
  next(): void;
  /** Ends Track 0 (finished or skipped): remembered, so it isn't offered again. */
  finish(): void;
}

/** Track 0's state: the current step, said through the speech mode, then its sound (with sound on). */
export function useTuning(): Tuning {
  const { state, dispatch } = useAppState();
  const commands = useCommands();
  const freshness = useFreshness();
  const { sst, rain } = useLiveData();
  const steps = useMemo(() => tuningSteps({ freshness, sst: sst?.meta ?? null, rain: rain?.meta ?? null }), [freshness, sst, rain]);
  const [index, setIndex] = useState(0);
  const playing = useRef<PlayerHandle | null>(null);
  // Counts presentations, so a slow say never plays the sound of a step already left.
  const shown = useRef(0);
  const step = steps[Math.min(index, steps.length - 1)];

  const stopSound = () => {
    playing.current?.stop();
    playing.current = null;
  };

  const present = useCallback(
    (s: TuningStep) => {
      const id = ++shown.current;
      stopSound();
      void commands.say((t, lang) => s.text(t, lang)).then(() => {
        if (id === shown.current && state.soundOn && s.play) playing.current = s.play();
      });
    },
    [commands, state.soundOn],
  );

  // Each step is presented once when it becomes current (and when Track 0 opens).
  useEffect(() => {
    present(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Leaving Track 0 stops its sound.
  useEffect(
    () => () => {
      shown.current++;
      stopSound();
    },
    [],
  );

  return {
    steps,
    index,
    step,
    again: () => present(step),
    next: () => setIndex((i) => Math.min(i + 1, steps.length - 1)),
    finish: () => {
      shown.current++;
      stopSound();
      dispatch({ type: "endTuning" });
    },
  };
}
