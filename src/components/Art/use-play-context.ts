"use client";

import { useEffect } from "react";
import { setArt, type PlayContext } from "@/lib/art/settings";

/** Tells the dial what the page plays now (record, play mode, frame month); cleared when the page goes. */
export function usePlayContext(context: PlayContext | null): void {
  const { recordId, playMode, month } = context ?? { recordId: null, playMode: null, month: null };
  useEffect(() => {
    setArt({ context: recordId && playMode ? { recordId, playMode, month } : null });
  }, [recordId, playMode, month]);
  useEffect(() => () => setArt({ context: null }), []);
}

/** The month (1–12) of an ISO time, or null. */
export const monthOf = (iso: string | undefined | null): number | null => (iso ? Number(iso.slice(5, 7)) || null : null);
