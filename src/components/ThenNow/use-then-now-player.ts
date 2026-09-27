"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayhead } from "@/hooks/use-playhead";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle, ThenNowInput, ThenNowPart } from "@/lib/audio-adapter/types";
import { windowLabel, type YearlyPart } from "@/lib/then-now";
import type { DhakaThenNowDemo } from "@/types/data-contract";

export type Part = Exclude<ThenNowPart, "all">;

const PART_OF_PLAYER: Record<string, Part> = {
  "thenNow.heat": "heat",
  "thenNow.monsoon": "monsoon",
  "thenNow.water": "water",
};

/**
 * Play controls and playheads for Then vs Now. Returns which part is sounding
 * (so "Play all" can move the view along) and the data index at the playhead.
 */
export function useThenNowPlayer(input: ThenNowInput | null, demo: DhakaThenNowDemo | null) {
  const handle = useRef<PlayerHandle | null>(null);
  // True from start until the player finishes or is stopped, so the view isn't
  // held by a lingering playhead after Stop.
  const [active, setActive] = useState(false);
  const thenNowHead = usePlayhead("thenNow.");
  const splitHead = usePlayhead("compare.split");

  // Leaving Then vs Now stops whatever it was playing.
  useEffect(() => () => handle.current?.stop(), []);

  const start = (next: () => PlayerHandle) => {
    handle.current?.stop();
    const h = next();
    handle.current = h;
    setActive(true);
    void h.done.then(() => {
      if (handle.current === h) setActive(false);
    });
  };

  return {
    playPart: (part: ThenNowPart) => input && start(() => audio.playThenNow(input, part)),
    playSplit: (part: YearlyPart) => {
      if (!demo) return;
      const pair = part === "heat" ? demo.heat : demo.rain.gpcp;
      start(() =>
        audio.playCompare(
          { label: windowLabel(pair.A), values: pair.A.values, voice: part },
          { label: windowLabel(pair.B), values: pair.B.values, voice: part },
          "split",
        ),
      );
    },
    stop: () => handle.current?.stop(),
    /** The part the playhead is in, if a Then vs Now player is sounding. */
    soundingPart: active && thenNowHead ? PART_OF_PLAYER[thenNowHead.player] ?? null : null,
    /** Index into the part's data (years A then B, or GRACE months). */
    index: active ? thenNowHead?.index ?? null : null,
    /** Split playback: the same index plays in both windows at once. */
    splitIndex: active ? splitHead?.index ?? null : null,
  };
}
