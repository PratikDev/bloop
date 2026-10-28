"use client";

import { useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { voiceSpec } from "@/lib/audio/mapping";
import { cn } from "@/lib/utils";
import { formatUtc } from "@/lib/i18n";
import { hearLine } from "@/lib/what-you-hear";
import { useAppState, useT } from "./AppState/use-app-state";
import { useLiveData } from "./LiveData/use-live-data";
import { SourceBadges } from "./SourceBadges";
import { useTimeLapse } from "./TimeLapse/use-time-lapse";

/**
 * Plan §16 frame label for every frame on screen. The frame time is always
 * visible; during the time-lapse it is the time of the frame being shown.
 * Each frame carries its source and data-age badges (meta/freshness.json).
 */
export function FrameLabel({ className }: { className?: string }) {
  const { state } = useAppState();
  const { sst, rain, fields } = useLiveData();
  const t = useT();
  const freshness = useFreshness();
  const [now] = useState(Date.now);
  const { current } = useTimeLapse();
  const frames = current
    ? [{ product: t("frame.product.rain"), time: current.timeUtc, voice: "rain" as const }]
    : [
        state.track !== "rain" && sst ? { product: t("frame.product.ocean"), time: sst.meta.frame_time_utc, voice: "ocean" as const } : null,
        state.track !== "ocean" && rain ? { product: t("frame.product.rain"), time: rain.meta.frame_time_utc, voice: "rain" as const } : null,
      ].filter((f) => f !== null);

  return (
    <div className={cn("space-y-1 text-small text-haze", className)}>
      {frames.map((f) => {
        const product = voiceSpec(f.voice).source.product;
        return (
          <div key={f.product} className="space-y-0.5">
            <p>{t("frame.label", { product: f.product, datetime: formatUtc(f.time, state.lang) })}</p>
            {fields && <p>{hearLine(t, f.voice, fields)}</p>}
            {product && <SourceBadges entry={freshness?.products[product]} now={now} tr={t} lang={state.lang} />}
          </div>
        );
      })}
    </div>
  );
}
