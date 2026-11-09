"use client";

import { useRecordedTexture } from "@/hooks/use-recorded-texture";
import { useT } from "../../AppState/use-app-state";
import { Turntable } from "../../Turntable";

/**
 * The Turntable: the live Earth on a disc, its scenes, its own dock and drawers. It plays on the Jukebox engine
 * (src/lib/audio-engines.ts), whose live voices carry the "recorded" texture when a track's data is stale (guardrail 16).
 */
export function TurntablePage() {
  const t = useT();
  useRecordedTexture();
  return (
    // A grid stretches the Turntable to the page: the screen below the header (phones scroll the shell, so a height).
    <div className="relative grid h-[calc(100dvh-4rem)] min-h-0 grid-rows-[minmax(0,1fr)] md:h-full">
      <h1 data-page-title tabIndex={-1} className="sr-only">
        {t("nav.turntable")}
      </h1>
      <Turntable />
    </div>
  );
}
