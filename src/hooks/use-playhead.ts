"use client";

import { useEffect, useState } from "react";
import { audio, clockNow, eventClockTime } from "@/lib/audio-adapter";
import { subscribeTicker } from "./use-ticker";

const LINGER_SEC = 1.5; // longer than the 0.8 s pause between Then and Now

export interface PlayheadStep {
  player: string;
  index: number;
  /** When it sounds, on the audio clock. */
  time: number;
}

/**
 * Follows the steps of players whose name starts with `playerPrefix`, on the audio clock. Step events arrive up to
 * 100 ms early, so they are queued and reported when they sound. `onFrame` runs every frame with the step sounding
 * (null when nothing is), how long the last step lasted (null until two have sounded), and the audio clock's time.
 */
export function followPlayhead(playerPrefix: string, onFrame: (step: PlayheadStep | null, stepSec: number | null, now: number) => void, target?: Element | null): () => void {
  let queue: PlayheadStep[] = [];
  let shown: PlayheadStep | null = null;
  let stepSec: number | null = null;

  const off = audio.onAudioEvent((e) => {
    if (e.kind !== "step" || !e.player.startsWith(playerPrefix)) return;
    queue.push({ player: e.player, index: e.index, time: eventClockTime(e) });
  });

  const unsubscribe = subscribeTicker(() => {
    const now = clockNow();
    while (queue.length > 0 && queue[0].time <= now) {
      const next = queue.shift();
      if (!next) break;
      if (shown && next.index === shown.index + 1) stepSec = next.time - shown.time;
      shown = next;
    }
    if (shown && queue.length === 0 && now - shown.time > LINGER_SEC) {
      shown = null;
      stepSec = null;
    }
    onFrame(shown, stepSec, now);
  }, target);

  return () => {
    off();
    queue = [];
    unsubscribe();
  };
}

/** The data index currently sounding for players whose name starts with `playerPrefix`, synced to the audio clock. null when nothing is playing. */
export function usePlayhead(playerPrefix: string): { player: string; index: number } | null {
  const [head, setHead] = useState<{ player: string; index: number } | null>(null);

  useEffect(() => {
    let last: PlayheadStep | null = null;
    return followPlayhead(playerPrefix, (step) => {
      if (step === last) return;
      last = step;
      setHead(step && { player: step.player, index: step.index });
    });
  }, [playerPrefix]);

  return head;
}
