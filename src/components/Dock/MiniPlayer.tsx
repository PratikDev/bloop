"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAppState } from "../AppState/use-app-state";
import { CaptionBar } from "../CaptionBar";
import { PlayerSheet } from "../Player";
import { Readout } from "../Readout";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { FrameProgress } from "./FrameProgress";
import { NeedleSlider } from "./NeedleSliders";
import { Sleeve } from "./Sleeve";
import { SoundButton } from "./SoundButton";
import { StalePill } from "./StalePill";

/**
 * The player bar, one calm row: the Play disc, what is under the needle (Listen) or the sleeve, the caption, West to
 * east (or the time-lapse's frames), and the page's few keys. Everything else lives in More.
 */
export function MiniPlayer({ keys, caption, slider = false, play = true, fullWidthKeys = false, className }: { keys: ReactNode; caption?: ReactNode; slider?: boolean; play?: boolean; fullWidthKeys?: boolean; className?: string }) {
  const { state } = useAppState();
  const { current: frame } = useTimeLapse();
  const listen = state.mode === "explore" || state.mode === "story";
  return (
    <div data-tt-occluder className={cn("surface-glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-t-sheet p-2 lg:flex-nowrap lg:py-1", className)}>
      <PlayerSheet />
      {play && <SoundButton />}
      {listen ? <Readout className="order-last basis-full lg:order-none lg:basis-auto lg:shrink-0" /> : <Sleeve />}
      <div className="order-last flex min-w-0 basis-full items-center gap-2 lg:order-none lg:flex-1 lg:basis-0">
        {listen && <StalePill />}
        {caption ?? <CaptionBar soundOnly={listen} className="min-h-0 min-w-0 flex-1 text-body" />}
      </div>
      {frame ? <FrameProgress frame={frame} className="order-last basis-full lg:order-none lg:flex-1 lg:basis-0" /> : slider && <NeedleSlider axis="lon" className="order-last basis-full lg:order-none lg:flex-1 lg:basis-0" />}
      <div className={cn("flex flex-wrap items-center gap-2", fullWidthKeys ? "basis-full lg:basis-auto" : "ml-auto")}>{keys}</div>
    </div>
  );
}
