"use client";

import { Pause, Play, SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isLiveMode } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

/**
 * The dock's main button: "Turn sound on" while sound is off (on any page),
 * otherwise Play / Pause for the live sound on the pages that have it.
 */
export function SoundButton() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  if (state.soundOn && !isLiveMode(state.mode)) return null;
  const label = t(!state.soundOn ? "sound.turnOn" : state.playing ? "sound.pause" : "sound.play");
  const Icon = !state.soundOn ? SpeakerHigh : state.playing ? Pause : Play;
  return (
    <Button
      onClick={commands.togglePlaying}
      aria-label={label}
      className={cn(
        "group relative h-12 shrink-0 gap-2 rounded-full pr-4 pl-1.5 text-body transition-transform duration-200 active:scale-[0.97]",
        state.soundOn ? "bg-tide hover:bg-tide/80" : "bg-shapla text-ink shadow-glow hover:bg-shapla",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-full", state.soundOn ? "bg-shapla text-ink" : "bg-ink/10")}>
        <Icon aria-hidden="true" weight="fill" className="size-4.5" />
      </span>
      <span aria-hidden="true" className="hidden sm:inline">
        {label}
      </span>
    </Button>
  );
}
