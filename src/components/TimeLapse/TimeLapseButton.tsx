"use client";

import { CloudRain, Square } from "lucide-react";
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
      aria-label={status === "loading" ? `${label}. ${t("timelapse.stop")}` : undefined}
      className={cn("relative overflow-hidden", className)}
    >
      {busy ? <Square aria-hidden="true" /> : <CloudRain aria-hidden="true" />}
      <span className="tabular-nums">{label}</span>
      {status === "loading" && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-tide">
          <span className="block h-full bg-shapla transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </span>
      )}
    </Button>
  );
}
