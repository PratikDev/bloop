"use client";

import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { ExploreControls } from "../ExploreControls";
import { FrameView } from "../FrameView";
import { useLiveData } from "../LiveData/use-live-data";
import { Readout } from "../Readout";
import { StatusBadge } from "../StatusBadge";
import { StoryPanel } from "../Story/StoryPanel";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { TrackChoice } from "../TrackChoice";

/** The map is the stage: full bleed, readout plate on it (below it on smaller screens). */
export function Stage() {
  const { rainStatus, sstStatus } = useLiveData();
  const { state } = useAppState();
  const t = useT();
  const timeLapse = useTimeLapse();
  return (
    // From 1280 px the map fits the stage both ways: width = min(stage width, 2 × stage height).
    // Below that it takes the full width, and the page scrolls if it must.
    <section className="flex min-h-0 min-w-0 flex-col bg-night xl:items-center xl:justify-center xl:[container-type:size]">
      <div className="relative xl:w-[min(100cqw,200cqh)]">
        <ExploreControls>
          {/* The frame opens out from the equator when the intro ends (C1). */}
          <FrameView revealClassName={cn(state.introDone && "animate-reveal-equator")} />
        </ExploreControls>
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-2">
          {rainStatus === "loading" && <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge>}
          {/* In Explore the time-lapse button shows the progress itself; Story has no button. */}
          {timeLapse.status === "loading" && state.mode !== "explore" && (
            <StatusBadge kind="loading">
              {timeLapse.progress ? t("timelapse.loading", timeLapse.progress) : t("timelapse.loadingStart")}
            </StatusBadge>
          )}
          {timeLapse.status === "error" && <StatusBadge kind="error">{t("timelapse.error")}</StatusBadge>}
        </div>
        {state.mode === "story" && (
          <StoryPanel className="px-4 py-3 lg:absolute lg:top-0 lg:left-0 lg:max-w-sm lg:rounded-br-lg lg:bg-scrim lg:short:max-w-md" />
        )}
        <Readout
          className={cn(
            "px-4 py-3 lg:pointer-events-none lg:absolute lg:bottom-0 lg:left-0 lg:rounded-tr-lg lg:bg-scrim",
            // 1024 to 1279 px: the map is smaller, so the plate takes at most 40% of its width.
            "lg:max-w-[40%] xl:max-w-lg",
            // Short screens: a shorter plate; from 1280 px also wider (each frame label on one line).
            "lg:short:py-2 xl:short:max-w-xl",
            // Story: the story panel has the left side, so the readout moves right (1024 to 1279 px, and short screens).
            state.mode === "story" &&
              "lg:max-xl:right-0 lg:max-xl:left-auto lg:max-xl:rounded-tr-none lg:max-xl:rounded-tl-lg xl:short:right-0 xl:short:left-auto xl:short:max-w-md xl:short:rounded-tr-none xl:short:rounded-tl-lg",
          )}
        />
      </div>
      {/* From 1280 px the selector is in the top bar; no padding then, or the strip pushes the map up. */}
      <div className="space-y-2 px-4 pb-3 xl:pb-0">
        <TrackChoice className="xl:hidden" itemClassName="h-11" />
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
        {rainStatus === "error" && <StatusBadge kind="error">{t("error.rain")}</StatusBadge>}
      </div>
    </section>
  );
}
