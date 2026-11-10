"use client";

import { useCallback, useState } from "react";
import { playEarconLive } from "@/lib/art/live/play";
import { earconFamily } from "@/lib/audio/orchestra";
import { FLAGS } from "@/lib/flags";
import { stepSound } from "../AppState/access";
import type { AppState } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";

/** Whether the category earcon may sound: sound on, nothing muted, and "Each step" sends sound. */
export function earconAllowed(s: Pick<AppState, "soundOn" | "allMuted" | "channels">): boolean {
  return FLAGS.artOrchestra && s.soundOn && !s.allMuted && stepSound(s);
}

/** Plays a record's category motif when the listener picks it; → how many have played (for the tests). */
export function useRecordEarcon(): [(record: string) => void, number] {
  const { state } = useAppState();
  const [played, setPlayed] = useState(0);
  const allowed = earconAllowed(state);
  const play = useCallback(
    (record: string) => {
      const family = earconFamily(record);
      if (!allowed || !family) return;
      if (playEarconLive(family)) setPlayed((n) => n + 1);
    },
    [allowed],
  );
  return [play, played];
}
