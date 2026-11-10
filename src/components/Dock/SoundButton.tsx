"use client";

import { Pause, Play, SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isLiveMode } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

/**
 * The player's sound key, on every page: "Turn sound on" while sound is off, otherwise Play / Pause for the live
 * sound. Coral only where it is the page's primary action (a page that plays the live sound, or sound off, except on
 * Then vs Now, whose coral Play turns sound on itself), so there is never more than one coral.
 */
export function SoundButton() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const label = t(!state.soundOn ? "sound.turnOn" : state.playing ? "sound.pause" : "sound.play");
  const Icon = !state.soundOn ? SpeakerHigh : state.playing ? Pause : Play;
  // Then vs Now's Play turns sound on itself, so the sound key never competes with it; Official's Play needs sound first.
  const primary = isLiveMode(state.mode) || (!state.soundOn && state.mode !== "thenNow");
  return (
    <Button
      onClick={commands.togglePlaying}
      className={cn("key border-navy h-14 shrink-0 gap-2 rounded-full px-5 text-body text-moon [&_svg]:size-6", primary ? "bg-shapla hover:bg-shapla" : "bg-paper hover:bg-paper")}
    >
      <Icon aria-hidden="true" weight="fill" />
      {label}
    </Button>
  );
}
