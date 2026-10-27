"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { formatUtc } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";
import {
  COMING_RECORDS,
  frameAgeDays,
  frameSource,
  LIVE_RECORDS,
  measuredError,
  RECORD_LABELS,
  recordFrames,
  type RecordFrame,
} from "./records";

const CARD = "h-auto w-64 shrink-0 flex-col items-start gap-1 rounded-lg px-3 py-2 text-left whitespace-normal lg:w-full";

/** A frame's label lines, all read from its metadata ("—" where a field is missing). */
function FrameFacts({ frame, now }: { frame: RecordFrame; now: number }) {
  const { state } = useAppState();
  const t = useT();
  const { dataset, svs } = frameSource(t, frame);
  const time = frame.meta.frame_time_utc;
  return (
    <span className="block space-y-0.5 text-small text-haze">
      <span className="block text-moon">
        {dataset} · {svs}
      </span>
      <span className="block">{time ? t("turntable.frameTime", { datetime: formatUtc(time, state.lang) }) : t("turntable.missing")}</span>
      <span className="block">{t("turntable.age", { days: time ? frameAgeDays(time, now) : null })}</span>
      <span className="block">{t("turntable.error", { text: measuredError(t, frame) })}</span>
    </span>
  );
}

/** Records beside the turntable: three live (the app's tracks), the rest "coming next". */
export function RecordCarousel({ onSelect, className }: { onSelect: (track: TrackMode) => void; className?: string }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const [now] = useState(Date.now);
  return (
    <div role="group" aria-label={t("turntable.records")} className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
      {LIVE_RECORDS.map((track) => (
        <Button
          key={track}
          variant="outline"
          aria-pressed={state.track === track}
          onClick={() => onSelect(track)}
          className={cn(CARD, "aria-pressed:bg-tide")}
        >
          <span className="text-lead font-medium">{t(RECORD_LABELS[track])}</span>
          {recordFrames(track, fields).map((frame) => (
            <FrameFacts key={frame.product} frame={frame} now={now} />
          ))}
          {track !== "ocean" && !fields?.rain && <span className="text-small text-haze">{t("badge.loadingRain")}</span>}
        </Button>
      ))}
      {COMING_RECORDS.map((record) => (
        <Button key={record} variant="outline" disabled className={cn(CARD, "w-40 border-dashed disabled:opacity-100 lg:w-full")}>
          <span className="text-lead font-medium text-haze">{t(RECORD_LABELS[record])}</span>
          <StatusBadge kind="october">{t("turntable.comingNext")}</StatusBadge>
        </Button>
      ))}
    </div>
  );
}
