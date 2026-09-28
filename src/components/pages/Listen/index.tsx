"use client";

import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ExploreControls } from "../../ExploreControls";
import { FrameView } from "../../FrameView";
import { Readout } from "../../Readout";
import { StoryPanel } from "../../Story/StoryPanel";
import { TrackChoice } from "../../TrackChoice";
import { FirstHint } from "./FirstHint";
import { Inspector } from "./Inspector";
import { ListenStatus } from "./ListenStatus";

/** On the map from 1024 px (lg); stacked around it below that. */
const PLATE = "lg:surface-glass lg:absolute lg:z-(--layer-map-plates) lg:rounded-plate";

/**
 * Listen: today's EIC frame as a sound map, full size. One plate says what the
 * page is and holds the track choice (or the tour while it runs); the readout
 * plate shows the value under the cursor; the Inspector opens on demand.
 * The dock (AppShell) holds the sound controls.
 */
export function ListenPage() {
  const { state } = useAppState();
  const t = useT();
  const story = state.mode === "story";
  return (
    <section aria-labelledby="listen-title" className="flex h-full min-h-0 flex-col lg:items-center lg:justify-center lg:px-4 lg:pb-2 lg:[container-type:size]">
      {/* From 1024 px the map fits the stage both ways: width = min(stage width, 2 × stage height). */}
      <div className="relative flex flex-col lg:w-[min(100cqw,200cqh)]">
        <div className={cn(PLATE, "order-first space-y-3 px-4 pt-3 pb-3 lg:top-3 lg:left-3 lg:max-w-sm lg:p-4", story && "lg:max-w-md")}>
          <h1 id="listen-title" data-page-title tabIndex={-1} className="font-serif text-title leading-tight md:text-headline lg:text-title">
            {t("listen.title")}
          </h1>
          {story ? <StoryPanel /> : <TrackChoice />}
          <ListenStatus />
        </div>

        <div className="relative overflow-hidden lg:rounded-plate lg:shadow-float">
          <ExploreControls>
            {/* The frame opens out from the equator when the intro ends (C1), and again on each visit. */}
            <FrameView revealClassName={cn(state.introDone && "animate-reveal-equator")} />
          </ExploreControls>
          <FirstHint />
        </div>

        <Readout
          className={cn(
            PLATE,
            "px-4 py-3 lg:pointer-events-none lg:bottom-3 lg:left-3 lg:max-w-[40%] lg:p-4 xl:max-w-md",
            "lg:short:py-2 xl:short:max-w-lg",
            // The tour's plate has the left side, so the readout moves right.
            story && "lg:right-3 lg:left-auto",
          )}
        />
        <Inspector />
      </div>
    </section>
  );
}
