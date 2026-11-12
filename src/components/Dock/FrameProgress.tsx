"use client";

import { formatUtc } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import type { TimeLapseFrame } from "../TimeLapse/use-time-lapse";

const THICK_EVERY = 6;

/** Which frame of the time-lapse is on screen. Read-only (the time-lapse can't seek), so it has no knob. */
export function FrameProgress({ frame, className }: { frame: TimeLapseFrame; className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const { index, total, timeUtc } = frame;
  return (
    <div
      role="progressbar"
      aria-label={t("timelapse.frame", { index: index + 1, total })}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={index + 1}
      aria-valuetext={`${formatUtc(timeUtc, state.lang)} UTC`}
      className={cn("flex h-5 min-w-0 overflow-hidden rounded-sm border-2 border-navy bg-paper", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn("min-w-0 flex-1 border-navy", i > 0 && (i % THICK_EVERY === 0 ? "border-l-2" : "border-l"), i < index ? "bg-bubble" : i === index ? "bg-shapla" : "bg-paper")}
        />
      ))}
    </div>
  );
}
