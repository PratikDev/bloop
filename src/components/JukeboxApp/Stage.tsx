"use client";

import { cn } from "@/lib/utils";
import { IS_INTERIM_ENGINE } from "@/lib/audio-adapter";
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
    // On wide screens the map fits the stage both ways: width = min(stage width, 2 × stage height).
    <section className="flex min-h-0 min-w-0 flex-col bg-night lg:items-center lg:justify-center lg:[container-type:size]">
      <div className="relative lg:w-[min(100cqw,200cqh)]">
        <ExploreControls>
          {/* The frame opens out from the equator when the intro ends (C1). */}
          <FrameView revealClassName={cn(state.introDone && "animate-reveal-equator")} />
        </ExploreControls>
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-2">
          {IS_INTERIM_ENGINE && (
            <StatusBadge kind="interim">
              <span title={t("badge.interimEngineHint")}>{t("badge.interimEngine")}</span>
            </StatusBadge>
          )}
          {rainStatus === "loading" && <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge>}
          {timeLapse.status === "loading" && (
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
            "px-4 py-3 lg:pointer-events-none lg:absolute lg:bottom-0 lg:left-0 lg:max-w-lg lg:rounded-tr-lg lg:bg-scrim",
            // Short screens: a wider, shorter plate (each frame label on one line).
            "lg:short:max-w-xl lg:short:py-2",
            // Short screens in Story: the story panel has the left side, so the readout moves right.
            state.mode === "story" && "lg:short:right-0 lg:short:left-auto lg:short:max-w-md lg:short:rounded-tr-none lg:short:rounded-tl-lg",
          )}
        />
      </div>
      <div className="space-y-2 px-4 pb-3">
        <TrackChoice className="xl:hidden" itemClassName="h-11" />
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
        {rainStatus === "error" && <StatusBadge kind="error">{t("error.rain")}</StatusBadge>}
      </div>
    </section>
  );
}
