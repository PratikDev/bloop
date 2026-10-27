"use client";

import { formatUtc } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { En, type TT } from "./i18n";
import { frameAgeDays, frameSource, measuredError, type RecordFrame } from "./records";

/** A frame's facts, all read from its metadata ("—" where a field is missing). */
export function FrameFacts({ frame, now, tt }: { frame: RecordFrame; now: number; tt: TT }) {
  const { state } = useAppState();
  const t = useT();
  const bn = state.lang === "bn";
  const { dataset, svs } = frameSource(t, frame);
  const time = frame.meta.frame_time_utc;
  return (
    <span className="block space-y-0.5 text-body">
      <span className="block font-medium text-moon">
        <En active={bn}>{dataset}</En> · <En active={bn}>{svs}</En>
      </span>
      <span className="block text-moon">{time ? tt("turntable.frameTime", { datetime: formatUtc(time, state.lang) }) : tt("turntable.missing")}</span>
      <span className="block text-moon">{tt("turntable.age", { days: time ? frameAgeDays(time, now) : null })}</span>
      <span className="block text-moon">
        {tt("turntable.error", { text: "" })}
        <En active={bn}>{measuredError(t, frame)}</En>
      </span>
    </span>
  );
}
