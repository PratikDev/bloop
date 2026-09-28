"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import type { CompareSide, PlayerHandle } from "@/lib/audio-adapter/types";
import { postCaption } from "@/lib/ui-captions";

export const HISTORY_PLAYER = "history";
const MONTH_PLAYER = "history.scrub";
const MONTH_STEP_MS = 300; // how long one dragged-to month sounds

/**
 * Place History's two ways to listen: a whole decade (step events under
 * "history" drive the playhead), or one month dragged to on the chart. Either
 * one ends the other, so sound and chart never disagree.
 */
export function useHistoryPlayers() {
  const decade = useRef<PlayerHandle | null>(null);
  const month = useRef<PlayerHandle | null>(null);
  // The range that is actually sounding; the playhead follows it, not the current selection.
  const [playingFrom, setPlayingFrom] = useState<number | null>(null);
  const [monthIndex, setMonthIndex] = useState<number | null>(null);

  useEffect(
    () => () => {
      decade.current?.stop();
      month.current?.stop();
    },
    [],
  );

  // Stopped, not finished: no "History finished" caption.
  const stopDecade = useCallback(() => {
    const h = decade.current;
    decade.current = null;
    h?.stop();
    setPlayingFrom(null); // hide the playhead now, not after the playhead's linger
  }, []);

  const stop = useCallback(() => {
    stopDecade();
    month.current?.stop();
    setMonthIndex(null);
  }, [stopDecade]);

  const playDecade = useCallback((side: CompareSide, from: number) => {
    decade.current?.stop();
    setMonthIndex(null);
    const h = audio.playSeries(side, { player: HISTORY_PLAYER });
    decade.current = h;
    setPlayingFrom(from);
    // playSeries captions the start ("Now playing: …") but not the end, so History posts that.
    void h.done.then(() => {
      if (decade.current !== h) return;
      setPlayingFrom(null);
      postCaption("caption.history.end");
    });
  }, []);

  /** Shows month `index`; plays `side` (that one month) when sound is on. A new month replaces the last. */
  const playMonth = useCallback(
    (index: number, side: CompareSide | null) => {
      stopDecade();
      setMonthIndex(index);
      if (side) month.current = audio.playSeries(side, { player: MONTH_PLAYER, stepMs: MONTH_STEP_MS });
    },
    [stopDecade],
  );

  return { playingFrom, monthIndex, stop, playDecade, playMonth };
}
