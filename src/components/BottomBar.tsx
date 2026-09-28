"use client";

import { Keyboard, Pause, Play, Radar, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppState, useT } from "./AppState/use-app-state";
import { CaptionBar } from "./CaptionBar";
import { Credits } from "./Credits";
import { useCommands } from "./Commands/use-commands";
import { Mixer } from "./Mixer";
import { TimeLapseButton } from "./TimeLapse/TimeLapseButton";
import { Waveform } from "./Waveform";

const BAR_BUTTON = "h-11 gap-2 px-3 text-body";

export function BottomBar() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();

  return (
    <footer className="space-y-1 bg-dusk px-4 pt-2 pb-3">
      <CaptionBar />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button variant="secondary" onClick={commands.togglePlaying} className={BAR_BUTTON}>
          {state.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {t(!state.soundOn ? "sound.turnOn" : state.playing ? "sound.pause" : "sound.play")}
        </Button>

        <Mixer className="hidden lg:flex" />
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" className={`${BAR_BUTTON} lg:hidden`} />}>
            <SlidersHorizontal aria-hidden="true" />
            {t("mixer.label")}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-sheet bg-dusk p-4">
            <SheetTitle className="text-lead">{t("mixer.label")}</SheetTitle>
            <Mixer className="flex-col items-start" />
          </SheetContent>
        </Sheet>

        {state.mode !== "story" && (
          <Button variant="ghost" onClick={commands.playSweep} className={BAR_BUTTON}>
            <Radar aria-hidden="true" />
            {t("sweep.play")}
          </Button>
        )}
        {state.mode === "explore" && <TimeLapseButton className={BAR_BUTTON} />}
        <Button variant="ghost" onClick={commands.openHelp} className={`${BAR_BUTTON} hidden md:inline-flex`}>
          <Keyboard aria-hidden="true" />
          {t("help.keys")}
        </Button>
        <Waveform className="ml-auto hidden sm:block" />
      </div>
      <Credits t={t} className="pt-1" />
    </footer>
  );
}
