"use client";

import { frameGap, gapLong } from "@/lib/frame-gap";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "./AppState/use-app-state";
import { useLiveData } from "./LiveData/use-live-data";

/**
 * Both mode (mentor item 1): the ocean and rain frames' own times and how far apart they are, from the two
 * manifests. The caller shows it only where both play together.
 */
export function FrameGapNote({ className }: { className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const { sst, rain } = useLiveData();
  const gap = sst && rain ? frameGap(sst.meta.frame_time_utc, rain.meta.frame_time_utc) : null;
  if (!gap) return null;
  return (
    <p data-testid="frame-gap" data-gap-ms={gap.ms} className={cn("text-small text-moon", className)}>
      <span className="sr-only">{t("frameGap.label")}: </span>
      {gapLong(t, state.lang, gap)}
    </p>
  );
}
