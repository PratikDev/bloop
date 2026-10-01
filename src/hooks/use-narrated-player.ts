"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppState/use-app-state";
import { describeOn } from "@/components/CaptionBar/use-describe";
import { useCommands, type Line } from "@/components/Commands/use-commands";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle } from "@/lib/audio-adapter/types";
import { holdDescribe } from "@/lib/ui-captions";

/** One sound, and the lines said before it. */
export interface NarratedStep<Tag extends string> {
  lines: Line[];
  play: () => PlayerHandle;
  /** What the step is about (e.g. a Then vs Now part), from its first line to the end of its sound. */
  tag?: Tag;
}

export interface NarratedScript<Tag extends string> {
  steps: NarratedStep<Tag>[];
  /** Said after the last sound. */
  end?: Line;
  /** After everything has played to the end (not when stopped). */
  onEnd?: () => void;
}

/**
 * Plays sounds one after another, keeping speech and sound apart: each step's
 * lines are said first, then its sound plays with Describe quiet, so the voice
 * never talks over the data. `narrating` says whether there is anything to say
 * (Describe on); without it, callers pass no lines. stop(), a new start(), Esc
 * or leaving the page ends the whole script.
 */
export function useNarratedPlayer<Tag extends string = string>() {
  const { state } = useAppState();
  const { say } = useCommands();
  const latestSay = useRef(say);
  useEffect(() => {
    latestSay.current = say;
  });
  const run = useRef(0);
  const handle = useRef<PlayerHandle | null>(null);
  const saying = useRef(false);
  const [active, setActive] = useState(false);
  const [tag, setTag] = useState<Tag | null>(null);

  const cancel = useCallback(() => {
    run.current++;
    const h = handle.current;
    handle.current = null;
    h?.stop();
    setActive(false);
    setTag(null);
  }, []);

  useEffect(() => {
    // Esc stops every sound (the engine captions it "caption.stopped"); the steps still to come stop with it.
    const off = audio.onAudioEvent((e) => {
      if (e.kind === "caption" && e.key === "caption.stopped") cancel();
    });
    return () => {
      off();
      cancel();
    };
  }, [cancel]);

  const stop = useCallback(() => {
    // A line being said stops too (stop() only reaches the sound engine's players).
    if (saying.current && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    cancel();
  }, [cancel]);

  const start = useCallback(
    async (script: NarratedScript<Tag>) => {
      stop();
      const id = run.current;
      const live = () => id === run.current;
      const sayLine = async (line: Line) => {
        saying.current = true;
        try {
          await latestSay.current(line);
        } finally {
          saying.current = false;
        }
      };
      setActive(true);
      for (const step of script.steps) {
        setTag(step.tag ?? null);
        for (const line of step.lines) {
          await sayLine(line);
          if (!live()) return;
        }
        const release = holdDescribe();
        try {
          const h = step.play();
          handle.current = h;
          await h.done;
        } finally {
          release();
        }
        if (!live()) return;
      }
      handle.current = null;
      if (script.end) {
        await sayLine(script.end);
        if (!live()) return;
      }
      setActive(false);
      setTag(null);
      script.onEnd?.();
    },
    [stop],
  );

  return { narrating: describeOn(state), active, tag, start, stop };
}
