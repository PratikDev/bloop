"use client";

import { useCallback } from "react";
import { useAppState } from "@/components/AppState/use-app-state";
import { useCommands } from "@/components/Commands/use-commands";
import { ensureAudioAll } from "@/lib/audio-engines";

/**
 * Starts sound from the user's own Play gesture (never autoplay). On a page opened by URL the app's sound is still
 * off ("Tap to start sound"), so a Play button turns it on, the way Start does; otherwise it only wakes the engines.
 */
export function useSoundStart(): () => Promise<void> {
  const { state } = useAppState();
  const commands = useCommands();
  return useCallback(async () => {
    if (!state.soundOn) await commands.enableSound();
    else await ensureAudioAll();
  }, [state.soundOn, commands]);
}
