"use client";

import type { ReactNode } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { cn } from "@/lib/utils";
import { useAppState } from "../AppState/use-app-state";
import { CaptionBar } from "../CaptionBar";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { FrameProgress } from "./FrameProgress";
import { GoToMenu } from "./GoToMenu";
import { NeedleSliders } from "./NeedleSliders";
import { PlayerKey } from "./PlayerKey";
import { Sleeve } from "./Sleeve";
import { Transport } from "./Transport";

/**
 * The player bar, the same one on every page after Start: sleeve and title (not on Listen, whose crown already
 * shows them), the transport, the caption over the needle sliders (or the time-lapse's frames), and the page's keys.
 */
export function MiniPlayer({
  keys,
  caption,
  onTrack,
  fullWidthKeys = false,
  className,
}: {
  keys: ReactNode;
  caption?: ReactNode;
  onTrack?: (track: TrackMode) => void;
  /** Many keys (the Turntable): they get a row of their own. */
  fullWidthKeys?: boolean;
  className?: string;
}) {
  const { state } = useAppState();
  const { current: frame } = useTimeLapse();
  const explore = state.mode === "explore";
  const listen = explore || state.mode === "story";
  const needle = explore || state.mode === "turntable";
  return (
    <div data-tt-occluder className={cn("surface-glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sheet p-2", className)}>
      {!listen && <Sleeve />}
      <Transport onTrack={onTrack} />
      <PlayerKey className={listen ? undefined : "md:hidden"} />
      {/* On phones the transport and keys share the top row, and the caption and sliders take the full width below. */}
      <div className="order-last flex w-full min-w-0 flex-col justify-center gap-1 md:order-none md:w-auto md:flex-[1_1_18rem]">
        {caption ?? <CaptionBar className="min-h-0 text-body" />}
        {frame ? <FrameProgress frame={frame} /> : needle && <NeedleSliders extra={explore ? <GoToMenu /> : undefined} />}
      </div>
      <div className={cn("flex flex-wrap items-center gap-2", fullWidthKeys ? "order-last basis-full" : "flex-1 justify-end xl:flex-none")}>{keys}</div>
    </div>
  );
}
