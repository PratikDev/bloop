"use client";

import { Pause, Play, SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { isLiveMode } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

/**
 * The player's main button, a coral disc: "Turn sound on" while sound is off (on any page),
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
    <Button onClick={commands.togglePlaying} aria-label={label} className="key size-16 shrink-0 rounded-full bg-shapla text-moon hover:bg-shapla [&_svg]:size-7">
      <Icon aria-hidden="true" weight="fill" />
    </Button>
  );
}
