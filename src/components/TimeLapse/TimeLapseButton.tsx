"use client";

import { CloudRain, Stop } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useTimeLapse } from "./use-time-lapse";

/**
 * Play / stop the storm time-lapse. While the frames load (10 MB the first
 * time), the button shows the percentage and fills along its bottom edge, and
 * pressing it cancels the load.
 */
export function TimeLapseButton({ className }: { className?: string }) {
  const timeLapse = useTimeLapse();
  const t = useT();
  const { status, progress } = timeLapse;
  const busy = status === "loading" || status === "playing";
  const percent = progress && progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
  const label = status === "loading" ? t("timelapse.loadingShort", { percent }) : t(status === "playing" ? "timelapse.stop" : "timelapse.play");

  return (
    <Button
      variant="ghost"
      onClick={busy ? timeLapse.stop : () => void timeLapse.start()}
      // Loading: say what pressing it does, since the visible text is the percentage.
      // Always the full name, so the phone's short word never changes it (the word is part of it).
      aria-label={status === "loading" ? `${label}. ${t("timelapse.stop")}` : label}
      className={cn("overflow-hidden", className)}
    >
      {busy ? <Stop aria-hidden="true" weight="fill" /> : <CloudRain aria-hidden="true" />}
      {/* The visible word: short below 1024 px, a little longer from there; both are part of the name. */}
      <span aria-hidden="true" className="tabular-nums lg:hidden">
        {status === "loading" ? label : t(status === "playing" ? "dock.short.stop" : "dock.short.timelapse")}
      </span>
      <span aria-hidden="true" className="hidden tabular-nums lg:inline">
        {status === "loading" ? label : t(status === "playing" ? "timelapse.stop" : "dock.label.timelapse")}
      </span>
      {status === "loading" && (
        <span aria-hidden="true" className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-tide">
          <span className="block h-full origin-left bg-shapla transition-transform duration-200" style={{ transform: `scaleX(${percent / 100})` }} />
        </span>
      )}
    </Button>
  );
}
