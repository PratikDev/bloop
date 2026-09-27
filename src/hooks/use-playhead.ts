"use client";

import { useEffect, useState } from "react";
import { audio, clockNow, eventClockTime } from "@/lib/audio-adapter";

const LINGER_SEC = 1.5; // longer than the 0.8 s pause between Then and Now

/**
 * The data index currently sounding for players whose name starts with
 * `playerPrefix` (e.g. "thenNow.heat"), synced to the audio clock. Step events
 * arrive up to 100 ms early, so they are queued and shown when they sound.
 * null when nothing is playing.
 */
export function usePlayhead(playerPrefix: string): { player: string; index: number } | null {
  const [head, setHead] = useState<{ player: string; index: number } | null>(null);

  useEffect(() => {
    let queue: { player: string; index: number; time: number }[] = [];
    let shown: { player: string; index: number; time: number } | null = null;
    let raf = 0;

    const off = audio.onAudioEvent((e) => {
      if (e.kind !== "step" || !e.player.startsWith(playerPrefix)) return;
      queue.push({ player: e.player, index: e.index, time: eventClockTime(e) });
    });

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = clockNow();
      let next = shown;
      while (queue.length > 0 && queue[0].time <= now) next = queue.shift() ?? next;
      if (next !== shown) {
        shown = next;
        setHead(next && { player: next.player, index: next.index });
      } else if (shown && queue.length === 0 && now - shown.time > LINGER_SEC) {
        shown = null;
        setHead(null);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      off();
      queue = [];
      cancelAnimationFrame(raf);
    };
  }, [playerPrefix]);

  return head;
}
