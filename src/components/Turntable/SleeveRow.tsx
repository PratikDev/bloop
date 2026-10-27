"use client";

import { Lock, Play, RotateCcw, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { formatUtc } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { En, useTT, type TT } from "./i18n";
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

/** A frame's facts, all read from its metadata ("—" where a field is missing). */
function FrameFacts({ frame, now, tt }: { frame: RecordFrame; now: number; tt: TT }) {
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

function Sleeve({ track, cover, now, onSelect }: { track: TrackMode; cover: string | undefined; now: number; onSelect: (t: TrackMode) => void }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { tt } = useTT();
  const [back, setBack] = useState(false);
  const playing = state.track === track;
  const name = tt(RECORD_LABELS[track]);

  return (
    <li className={cn("w-56 shrink-0 transition-transform duration-300 lg:w-full", playing && "-translate-y-1")}>
      <div className="perspective-distant">
        <div className={cn("relative h-52 transition-transform duration-500 transform-3d", back && "rotate-y-180")}>
          <button
            type="button"
            onClick={() => onSelect(track)}
            aria-pressed={playing}
            aria-label={tt("turntable.sleeve.play", { record: name })}
            inert={back}
            className="absolute inset-0 overflow-hidden rounded-lg border-2 border-haze bg-night text-left backface-hidden aria-pressed:border-shapla"
          >
            {/* The cover is this record's own frame, drawn like the flat map. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-scrim px-3 py-2">
              <span className="text-lead font-semibold text-moon">{name}</span>
              {playing ? (
                <span className="flex items-center gap-1 text-body text-moon">
                  <Volume2 aria-hidden="true" className="size-4" />
                  {tt("turntable.sleeve.playing")}
                </span>
              ) : (
                <Play aria-hidden="true" className="size-5 text-moon" />
              )}
            </span>
          </button>
          <div inert={!back} className="absolute inset-0 overflow-y-auto rounded-lg border-2 border-haze bg-dusk p-3 rotate-y-180 backface-hidden">
            <p className="mb-1 text-lead font-semibold text-moon">{name}</p>
            <div className="space-y-2">
              {recordFrames(track, fields).map((f) => (
                <FrameFacts key={f.product} frame={f} now={now} tt={tt} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        aria-expanded={back}
        aria-label={tt("turntable.sleeve.flip", { record: name, back })}
        onClick={() => setBack((b) => !b)}
        className="mt-1 h-11 w-full gap-2 text-body"
      >
        <RotateCcw aria-hidden="true" />
        {tt(back ? "turntable.sleeve.cover" : "turntable.sleeve.details")}
      </Button>
    </li>
  );
}

/** Live records first (sleeves with the frame as cover); EIC areas not live yet, small and locked. */
export function SleeveRow({ covers, onSelect, className }: { covers: Partial<Record<TrackMode, string>>; onSelect: (track: TrackMode) => void; className?: string }) {
  const { tt } = useTT();
  const [now] = useState(Date.now);
  return (
    <section aria-label={tt("turntable.records")} className={className}>
      <h2 className="mb-2 text-lead font-semibold text-moon">{tt("turntable.records")}</h2>
      <ul className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
        {LIVE_RECORDS.map((track) => (
          <Sleeve key={track} track={track} cover={covers[track]} now={now} onSelect={onSelect} />
        ))}
      </ul>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {COMING_RECORDS.map((record) => (
          <li key={record} className="flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-haze px-2 py-1">
            <Lock aria-hidden="true" className="size-4 shrink-0 text-moon" />
            <span className="text-body text-moon">
              {tt(RECORD_LABELS[record])}
              <span className="sr-only">: {tt("turntable.comingNext")}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-body text-haze">{tt("turntable.comingNext")}</p>
    </section>
  );
}
