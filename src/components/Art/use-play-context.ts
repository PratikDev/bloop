"use client";

import { useEffect } from "react";
import { setArt, type PlayContext } from "@/lib/art/settings";

export function usePlayContext(context: PlayContext | null): void {
  const { recordId, playMode, month } = context ?? { recordId: null, playMode: null, month: null };
  useEffect(() => {
    setArt({ context: recordId && playMode ? { recordId, playMode, month } : null });
  }, [recordId, playMode, month]);
  useEffect(() => () => setArt({ context: null }), []);
}

export const monthOf = (iso: string | undefined | null): number | null => (iso ? Number(iso.slice(5, 7)) || null : null);
