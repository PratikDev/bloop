"use client";

import { Box, Clock, Ghost, Lock, Mountain, Play, RotateCcw, Volume2, Waves, type LucideIcon } from "lucide-react";
import { brailleLabel } from "@/a11y/aria";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useTT } from "./i18n";
import { FrameFacts } from "./FrameFacts";
import { COMING_RECORDS, LIVE_RECORDS, RECORD_LABELS, recordFrames } from "./records";
import { SCENE_IDS, SCENE_SLEEVES, type SceneId } from "../Scenes/registry";

/** Each scene's sleeve: flat line art on one palette fill. */
const SCENE_ART: Record<SceneId, { icon: LucideIcon; fill: string }> = {
  ghost: { icon: Ghost, fill: "bg-dial" },
  delta: { icon: Waves, fill: "bg-sea-deep" },
  terrain: { icon: Mountain, fill: "bg-bubble" },
  tunnel: { icon: Clock, fill: "bg-shapla" },
};

function Sleeve({ track, cover, now, onSelect }: { track: TrackMode; cover: string | undefined; now: number; onSelect: (t: TrackMode) => void }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { tt } = useTT();
  const t = useT();
  const [back, setBack] = useState(false);
  const playing = state.track === track;
  const name = tt(RECORD_LABELS[track]);

  return (
    <li className={cn("w-52 shrink-0 snap-start transition-transform duration-300", playing && "-translate-y-1")}>
      <div className="perspective-distant">
        <div className={cn("relative h-48 transition-transform duration-500 transform-3d", back && "rotate-y-180")}>
          <button
            type="button"
            onClick={() => onSelect(track)}
            aria-pressed={playing}
            aria-label={tt("turntable.sleeve.play", { record: name })}
            {...brailleLabel(t("braille.bl.record", { record: name, playing }))}
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
        {...brailleLabel(t("braille.bl.flip", { record: name, back }))}
        onClick={() => setBack((b) => !b)}
        className="mt-1 h-11 w-full gap-2 text-body"
      >
        <RotateCcw aria-hidden="true" />
        {tt(back ? "turntable.sleeve.cover" : "turntable.sleeve.details")}
      </Button>
    </li>
  );
}

/** A scene's sleeve; choosing it drops the needle into the scene. */
function SceneSleeve({ id, onScene }: { id: SceneId; onScene: (id: SceneId) => void }) {
  const { tt } = useTT();
  const t = useT();
  const name = tt(SCENE_SLEEVES[id]);
  const { icon: Icon, fill } = SCENE_ART[id];
  return (
    <li className="w-44 shrink-0 snap-start p-1">
      <button
        type="button"
        onClick={() => onScene(id)}
        aria-label={tt("scenes.open", { scene: name })}
        {...brailleLabel(t("braille.bl.scene", { scene: name }))}
        className="key flex aspect-square w-full flex-col overflow-hidden rounded-lg bg-paper text-left"
      >
        <span aria-hidden="true" className={cn("flex min-h-0 w-full flex-1 items-center justify-center", fill)}>
          <Icon className="size-16 text-moon" strokeWidth={1.5} />
        </span>
        <span className="flex items-center justify-between gap-2 border-t-2 border-line px-3 py-2">
          <span className="font-strip text-lead text-moon">{name}</span>
          <Box aria-hidden="true" className="size-4 shrink-0 text-moon" />
        </span>
      </button>
    </li>
  );
}

/** A carousel of record sleeves: live records (the frame as cover) first, then the 3D scenes; EIC areas not live yet, small and locked. */
export function SleeveRow({
  covers,
  onSelect,
  onScene,
  className,
}: {
  covers: Partial<Record<TrackMode, string>>;
  onSelect: (track: TrackMode) => void;
  onScene: (id: SceneId) => void;
  className?: string;
}) {
  const { tt } = useTT();
  const [now] = useState(Date.now);
  return (
    <section aria-label={tt("turntable.records")} className={className}>
      <h2 className="mb-2 text-lead font-semibold text-moon">{tt("turntable.records")}</h2>
      <ul className="flex snap-x gap-3 overflow-x-auto pt-1 pb-2">
        {LIVE_RECORDS.map((track) => (
          <Sleeve key={track} track={track} cover={covers[track]} now={now} onSelect={onSelect} />
        ))}
      </ul>
      <h3 className="mt-2 text-body font-semibold text-moon">{tt("scenes.heading")}</h3>
      <p className="text-small text-haze">{tt("scenes.note")}</p>
      <ul className="flex snap-x gap-3 overflow-x-auto pt-1 pb-2">
        {SCENE_IDS.map((id) => (
          <SceneSleeve key={id} id={id} onScene={onScene} />
        ))}
      </ul>
      <ul className="mt-2 flex flex-wrap gap-2">
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
