"use client";

import { SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

/**
 * Mentor item 2: a return visitor who chose sound gets a small, non-blocking prompt. Browsers start audio only after
 * a gesture, so the app never claims to play by itself: one tap turns sound on and the prompt goes. A visitor who chose
 * silence sees nothing; Reset sound choice (Home) brings the first-visit choice back.
 */
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
