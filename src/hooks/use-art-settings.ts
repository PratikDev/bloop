"use client";

import { useSyncExternalStore } from "react";
import { getArt, getServerArt, setArt, subscribeArt, type ArtState } from "@/lib/art/settings";

export function useArtSettings(): [ArtState, (patch: Partial<ArtState>) => void] {
  const state = useSyncExternalStore(subscribeArt, getArt, getServerArt);
  return [state, setArt];
}
