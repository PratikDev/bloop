"use client";

import { cn } from "@/lib/utils";
import { formatUtc } from "@/lib/i18n";
import { useAppState, useT } from "./AppState/use-app-state";
import { useLiveData } from "./LiveData/use-live-data";
import { useTimeLapse } from "./TimeLapse/use-time-lapse";

/**
 * Plan §16 frame label for every frame on screen. The frame time is always
 * visible; during the time-lapse it is the time of the frame being shown.
 */
export function FrameLabel({ className }: { className?: string }) {
  const { state } = useAppState();
  const { sst, rain } = useLiveData();
  const t = useT();
  const { current } = useTimeLapse();
  const frames = current
    ? [{ product: t("frame.product.rain"), time: current.timeUtc }]
    : [
    state.track !== "rain" && sst ? { product: t("frame.product.ocean"), time: sst.meta.frame_time_utc } : null,
    state.track !== "ocean" && rain ? { product: t("frame.product.rain"), time: rain.meta.frame_time_utc } : null,
  ].filter((f) => f !== null);

  return (
    <div className={cn("space-y-0.5 text-small text-haze", className)}>
      {frames.map((f) => (
        <p key={f.product}>{t("frame.label", { product: f.product, datetime: formatUtc(f.time, state.lang) })}</p>
      ))}
    </div>
  );
}
