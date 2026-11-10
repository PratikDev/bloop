"use client";

import { useSyncExternalStore } from "react";
import { getArt, getServerArt, setArt, subscribeArt, type ArtState } from "@/lib/art/settings";

/** The art settings (Instrument style, the dial, what plays now), and a setter that remembers them. */
export function useArtSettings(): [ArtState, (patch: Partial<ArtState>) => void] {
  const state = useSyncExternalStore(subscribeArt, getArt, getServerArt);
  return [state, setArt];
}
