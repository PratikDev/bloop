"use client";

import { cn } from "cn";
import { IS_INTERIM_ENGINE } from "@/lib/audio-adapter";
import { useAppState, useT } from "../AppState/use-app-state";
import { ExploreControls } from "../ExploreControls";
import { FrameView } from "../FrameView";
import { useLiveData } from "../LiveData/use-live-data";
import { Readout } from "../Readout";
import { StatusBadge } from "../StatusBadge";
import { TrackChoice } from "../TrackChoice";

/** The map is the stage: full bleed, readout plate on it (below it on smaller screens). */
export function Stage() {
  const { rainStatus, sstStatus } = useLiveData();
  const { state } = useAppState();
  const t = useT();
  return (
    // On wide screens the map fits the stage both ways: width = min(stage width, 2 × stage height).
    <section className="flex min-h-0 min-w-0 flex-col bg-night lg:items-center lg:justify-center lg:[container-type:size]">
      <div className="relative lg:w-[min(100cqw,200cqh)]">
        <ExploreControls>
          {/* The frame opens out from the equator when the intro ends (C1). */}
          <FrameView className={cn(state.introDone && "animate-reveal-equator")} />
        </ExploreControls>
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-2">
          {IS_INTERIM_ENGINE && (
            <StatusBadge kind="interim">
              <span title={t("badge.interimEngineHint")}>{t("badge.interimEngine")}</span>
            </StatusBadge>
          )}
          {rainStatus === "loading" && <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge>}
        </div>
        <Readout className="px-4 py-3 lg:pointer-events-none lg:absolute lg:bottom-0 lg:left-0 lg:max-w-lg lg:rounded-tr-lg lg:bg-scrim" />
      </div>
      <div className="space-y-2 px-4 pb-3">
        <TrackChoice className="lg:hidden" itemClassName="h-11" />
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
        {rainStatus === "error" && <StatusBadge kind="error">{t("error.rain")}</StatusBadge>}
      </div>
    </section>
  );
}
