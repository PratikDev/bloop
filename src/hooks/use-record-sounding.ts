"use client";

import { captionsLiveSound, liveSoundOn } from "@/components/AppState/reducer";
import { useAppState } from "@/components/AppState/use-app-state";
import { usePagePlayerSounding } from "./use-page-player";

/**
 * Whether the current page's record is sounding: its own player (Then vs Now, Month by month, Official records), or
 * the live sound on the pages whose record it is (Listen, Story, the Turntable). The player's caption, the crown's
 * tonearm and the chosen record's equaliser all follow it.
 */
export function useRecordSounding(): boolean {
  const { state } = useAppState();
  const pagePlayer = usePagePlayerSounding();
  return pagePlayer || (captionsLiveSound(state.mode) && liveSoundOn(state));
}
