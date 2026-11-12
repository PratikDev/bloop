"use client";

import { useState } from "react";
import { ArrowCounterClockwise, GearSix, MusicNotesSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { FLAGS } from "@/lib/flags";
import { AccessSettings } from "../AccessSettings";
import { useAppState, useT } from "../AppState/use-app-state";
import { ArtSettings } from "../Art/ArtSettings";
import { useCommands } from "../Commands/use-commands";
import { ChordToggle } from "../JukeboxRead/ChordToggle";
import { SettingToggle } from "../SettingToggle";
import { HEADER_KEY } from "./header-key";

const MENU_ACTION = "h-11 w-full justify-start gap-2 rounded-lg px-3 text-body font-normal hover:bg-tide/60";

/** The display, speech and sound-style settings, the Bloop motif and Reset sound choice: one key in the header. */
export function SettingsMenu() {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const [open, setOpen] = useState(false);
  const reset = () => {
    setOpen(false); // the start gate takes over; the menu must not stay on top of it
    commands.resetStart();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon-lg" aria-label={t("settings.open")} className={HEADER_KEY} />}>
        <GearSix aria-hidden="true" className="size-5" />
      </PopoverTrigger>
      <PopoverContent data-tt-occluder align="end" sideOffset={8} className="surface-glass max-h-(--available-height) w-72 gap-2 overflow-y-auto rounded-plate p-3 text-body">
        <PopoverTitle className="eyebrow px-1 pb-1">{t("settings.open")}</PopoverTitle>
        <SettingToggle setting="describe" />
        <SettingToggle setting="captions" />
        {/* With the accessibility core on, the three-way Speech choice replaces the Built-in voice switch. */}
        {FLAGS.speechChoices ? (
          <AccessSettings />
        ) : (
          <>
            <SettingToggle setting="builtInVoice" />
            <p className="px-1 text-small text-haze">{t("help.voiceNote")}</p>
          </>
        )}
        <SettingToggle setting="reduceMotion" />
        <SettingToggle setting="comfortableText" />
        <SettingToggle setting="soundWords" />
        {FLAGS.mapKeys && <SettingToggle setting="hide3d" />}
        {FLAGS.cvChord && <ChordToggle />}
        <ArtSettings />
        <Button variant="ghost" onClick={commands.playMotif} className={MENU_ACTION}>
          <MusicNotesSimple aria-hidden="true" className="size-5" />
          {t("motif.play")}
        </Button>
        {state.started && (
          <Button variant="ghost" onClick={reset} className={MENU_ACTION}>
            <ArrowCounterClockwise aria-hidden="true" className="size-5" />
            {t("home.resetChoice")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
