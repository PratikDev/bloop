"use client";

import { CloudRain, Grid3x2, Keyboard, Pause, Play, Radar, SlidersHorizontal, Square } from "lucide-react";
import { brailleLabel } from "@/a11y/aria";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppState, useT } from "./AppState/use-app-state";
import { CaptionBar } from "./CaptionBar";
import { Credits } from "./Credits";
import { ProductCredits } from "./ProductCredits";
import { useCommands } from "./Commands/use-commands";
import { Mixer } from "./Mixer";
import { useTimeLapse } from "./TimeLapse/use-time-lapse";
import { Waveform } from "./Waveform";
import { BRAILLE_EXPLORER_ID } from "./BrailleExplorer";

const BAR_BUTTON = "h-11 gap-2 px-3 text-body";

export function BottomBar() {
  const { state } = useAppState();
  const commands = useCommands();
  const timeLapse = useTimeLapse();
  const t = useT();

  return (
    <footer className="space-y-1 bg-dusk px-4 pt-2 pb-3">
      <CaptionBar />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button variant="secondary" onClick={commands.togglePlaying} className={BAR_BUTTON}
          {...brailleLabel(t(!state.soundOn ? "braille.bl.soundOn" : state.playing ? "braille.bl.pause" : "braille.bl.play"))}>
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
          <Button variant="ghost" onClick={commands.playSweep} className={BAR_BUTTON} {...brailleLabel(t("braille.bl.sweep"))}>
            <Radar aria-hidden="true" />
            {t("sweep.play")}
          </Button>
        )}
        {state.mode === "explore" && (
          <Button
            variant="ghost"
            onClick={timeLapse.status === "playing" ? timeLapse.stop : () => void timeLapse.start()}
            disabled={timeLapse.status === "loading"}
            className={BAR_BUTTON}
            {...brailleLabel(t(timeLapse.status === "playing" ? "braille.bl.stop" : "braille.bl.storm"))}
          >
            {timeLapse.status === "playing" ? <Square aria-hidden="true" /> : <CloudRain aria-hidden="true" />}
            {t(timeLapse.status === "playing" ? "timelapse.stop" : "timelapse.play")}
          </Button>
        )}
        {state.mode === "explore" && (
          <Button variant="ghost" onClick={() => commands.toggleBraille()} aria-expanded={state.brailleOpen}
            aria-controls={state.brailleOpen ? BRAILLE_EXPLORER_ID : undefined} className={BAR_BUTTON} {...brailleLabel(t("braille.bl.braille"))}>
            <Grid3x2 aria-hidden="true" />
            {t("braille.open")}
          </Button>
        )}
        <Button variant="ghost" onClick={commands.openHelp} className={`${BAR_BUTTON} hidden md:inline-flex`} {...brailleLabel(t("braille.bl.keys"))}>
          <Keyboard aria-hidden="true" />
          {t("help.keys")}
        </Button>
        <Waveform className="ml-auto hidden sm:block" />
      </div>
      <Credits t={t} className="pt-1" />
      <details className="text-small text-haze">
        <summary className="cursor-pointer">{t("credits.products")}</summary>
        <ProductCredits className="pt-1" />
      </details>
    </footer>
  );
}
