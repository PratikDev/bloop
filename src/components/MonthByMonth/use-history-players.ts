"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNarratedPlayer } from "@/hooks/use-narrated-player";
import { audio } from "@/lib/audio-adapter";
import type { CompareSide, PlayerHandle } from "@/lib/audio-adapter/types";
import { postCaption, quietSideCaption } from "@/lib/ui-captions";
import { captionLine } from "../CaptionBar/use-describe";
import type { ScrubMotion } from "../charts/HistoryChart";

export const HISTORY_PLAYER = "history";
const MONTH_PLAYER = "history.scrub";
const MONTH_STEP_MS = 300; // how long one dragged-to month sounds
// Continuous scrubbing (a drag or a held key): the month sounds once the motion
// rests this long. Each new sequence silences the last and has a short lead-in,
// so playing on every change would cut each month off before it sounds.
const REST_MS = 180;

/**
 * Place History's two ways to listen: a whole decade (step events under
 * "history" drive the playhead), or one month picked on the chart. Either one
 * ends the other, so sound and chart never disagree. With Describe on, the
 * decade's "Now playing" is said before it sounds and "History finished" after.
 */
export function useHistoryPlayers() {
  const { narrating, start: startDecade, stop: stopDecadeSound } = useNarratedPlayer();
  const month = useRef<PlayerHandle | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The range that is actually sounding; the playhead follows it, not the current selection.
  const [playingFrom, setPlayingFrom] = useState<number | null>(null);
  const [monthIndex, setMonthIndex] = useState<number | null>(null);

  const cancelPending = useCallback(() => {
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = null;
  }, []);

  useEffect(
    () => () => {
      cancelPending();
      month.current?.stop();
      quietSideCaption(null);
    },
    [cancelPending],
  );

  // Stopped, not finished: no "History finished" caption.
  const stopDecade = useCallback(() => {
    stopDecadeSound();
    setPlayingFrom(null); // hide the playhead now, not after the playhead's linger
  }, [stopDecadeSound]);

  const stopMonth = useCallback(() => {
    cancelPending();
    month.current?.stop();
    month.current = null;
    quietSideCaption(null);
  }, [cancelPending]);

  const stop = useCallback(() => {
    stopDecade();
    stopMonth();
    setMonthIndex(null);
  }, [stopDecade, stopMonth]);

  const playDecade = useCallback(
    (side: CompareSide, from: number) => {
      stopMonth();
      setMonthIndex(null);
      setPlayingFrom(from);
      // playSeries captions the start ("Now playing: …") but not the end, so History adds that:
      // said after the sound with Describe on, otherwise shown.
      void startDecade({
        steps: [
          {
            lines: narrating ? [captionLine("caption.compare.side", { label: side.label })] : [],
            play: () => audio.playSeries(side, { player: HISTORY_PLAYER }),
          },
        ],
        end: narrating ? captionLine("caption.history.end") : undefined,
        onEnd: () => {
          setPlayingFrom(null);
          if (!narrating) postCaption("caption.history.end");
        },
      });
    },
    [stopMonth, startDecade, narrating],
  );

  /**
   * Shows month `index` at once and plays `side` (that one month) when sound is on:
   * at once for a single step, after the motion rests when continuous. Its "Now
   * playing" caption is left out: the chart shows and announces the month.
   */
  const playMonth = useCallback(
    (index: number, side: CompareSide | null, motion: ScrubMotion) => {
      stopDecade();
      cancelPending();
      setMonthIndex(index);
      if (!side) return;
      const sound = () => {
        pending.current = null;
        quietSideCaption(side.label);
        month.current = audio.playSeries(side, { player: MONTH_PLAYER, stepMs: MONTH_STEP_MS });
      };
      if (motion === "step") sound();
      else pending.current = setTimeout(sound, REST_MS);
    },
    [stopDecade, cancelPending],
  );

  return { playingFrom, monthIndex, stop, playDecade, playMonth };
}
