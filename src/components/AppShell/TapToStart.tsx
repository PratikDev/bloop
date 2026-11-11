"use client";

import { SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

export function TapToStart() {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  if (!state.started || state.soundChoice !== "sound" || state.soundOn) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-(--layer-map-plates) flex justify-center px-4">
      <Button onClick={() => void commands.enableSound()} className="pointer-events-auto h-11 gap-2 rounded-full bg-shapla px-5 text-body text-ink shadow-float hover:bg-shapla/90">
        <SpeakerHigh aria-hidden="true" weight="fill" className="size-4.5" />
        {t("start.tapToStart")}
      </Button>
    </div>
  );
}
