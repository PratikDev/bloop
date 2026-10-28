"use client";

import { useFreshness } from "@/hooks/use-freshness";
import { formatUtc } from "@/lib/i18n";
import { hearLine } from "@/lib/what-you-hear";
import { useLiveData } from "../LiveData/use-live-data";
import { useAppState, useT } from "../AppState/use-app-state";
import { SourceBadges } from "../SourceBadges";
import { En, type TT } from "./i18n";
import { frameProduct, frameSource, measuredError, type RecordFrame } from "./records";

/** A frame's facts, all read from its metadata ("—" where a field is missing), with its source and data-age badges
 *  (the badge carries the age, in the book's "Latest available" wording). */
export function FrameFacts({ frame, now, tt }: { frame: RecordFrame; now: number; tt: TT }) {
  const { state } = useAppState();
  const t = useT();
  const freshness = useFreshness();
  const { fields } = useLiveData();
  const bn = state.lang === "bn";
  const { dataset, svs } = frameSource(t, frame);
  const time = frame.meta.frame_time_utc;
  const product = frameProduct(frame);
  return (
    <span className="block space-y-0.5 text-body">
      <span className="block font-medium text-moon">
        <En active={bn}>{dataset}</En> · <En active={bn}>{svs}</En>
      </span>
      <span className="block text-moon">{time ? tt("turntable.frameTime", { datetime: formatUtc(time, state.lang) }) : tt("turntable.missing")}</span>
      <span className="block text-moon">
        {tt("turntable.error", { text: "" })}
        <En active={bn}>{measuredError(t, frame)}</En>
      </span>
      {fields && (
        <span className="block text-haze">
          <En active={bn}>{hearLine(t, frame.product, fields)}</En>
        </span>
      )}
      {product && <SourceBadges entry={freshness?.products[product]} now={now} tr={tt} lang={state.lang} className="pt-1" />}
    </span>
  );
}
