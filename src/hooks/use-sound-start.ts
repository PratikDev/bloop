"use client";

import { useCallback } from "react";
import { useAppState } from "@/components/AppState/use-app-state";
import { useCommands } from "@/components/Commands/use-commands";
import { ensureAudioAll } from "@/lib/audio-engines";

export function useSoundStart(): () => Promise<void> {
  const { state } = useAppState();
  const commands = useCommands();
  return useCallback(async () => {
    if (!state.soundOn) await commands.enableSound();
    else await ensureAudioAll();
  }, [state.soundOn, commands]);
}
