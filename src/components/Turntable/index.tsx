"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { formatUtc } from "@/lib/i18n";
import { useAnnounce } from "../Announcer/use-announcer";
import { liveSoundOn } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { MAP_REGION_ID } from "../ExploreControls";
import { useLiveData } from "../LiveData/use-live-data";
import { Readout } from "../Readout";
import type { SentReading } from "./needle-sound";
import { RecordCarousel } from "./RecordCarousel";
import { FRAME_PRODUCT_LABELS, RECORD_LABELS, recordFrames, stepRecord } from "./records";
import { useGlobePointer } from "./use-globe-pointer";
import { TurntableControls } from "./TurntableControls";
import { useTurntable } from "./use-turntable";
import { useTurntableKeys } from "./use-turntable-keys";

// Developer overlay (?debug=1): its own chunk, never loaded otherwise.
const DebugOverlay = dynamic(() => import("./DebugOverlay").then((m) => m.DebugOverlay), { ssr: false });

const SEND_LOG_MAX = 5000;

/** After leaving, keyboard focus lands on the flat map rather than the page. */
const focusFlatMap = () => requestAnimationFrame(() => document.getElementById(MAP_REGION_ID)?.focus());

/**
 * Turntable Earth (prototype): the latest EIC frame on a globe that turns under
 * a fixed tonearm. The needle is the app's cursor and the records are its
 * tracks, so the readout, captions, speech and panels are the flat map's own.
 */
export function Turntable() {
  const { state, dispatch } = useAppState();
  const { fields } = useLiveData();
  const commands = useCommands();
  const announce = useAnnounce();
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const instructionsId = useId();
  const [debug] = useState(() => new URLSearchParams(window.location.search).get("debug") === "1");
  const sendLog = useRef<SentReading[]>([]);
  const [start] = useState(state.cursor);
  const record = t(RECORD_LABELS[state.track]);

  const tt = useTurntable({
    hostRef,
    canvasLabel: t("turntable.canvas", { record }),
    track: state.track,
    fields,
    liveOn: liveSoundOn(state),
    allMuted: state.allMuted,
    reduceMotion: state.reduceMotion,
    start,
    dispatch,
    onSend: debug
      ? (sent) => {
          sendLog.current.push(sent);
          if (sendLog.current.length > SEND_LOG_MAX) sendLog.current.shift();
        }
      : undefined,
  });
  const pointer = useGlobePointer(tt);

  const selectRecord = (track: TrackMode) => {
    dispatch({ type: "setTrack", track });
    const frames = recordFrames(track, fields)
      .map((f) => t("turntable.announce.frame", { product: t(FRAME_PRODUCT_LABELS[f.product]), datetime: formatUtc(f.meta.frame_time_utc, state.lang) }))
      .join(" ");
    announce(t("turntable.announce.record", { record: t(RECORD_LABELS[track]), frames }));
  };
  const toggleRotation = () => {
    tt.setRotating(!tt.rotating);
    announce(t(tt.rotating ? "turntable.announce.stoppedTurning" : "turntable.announce.turning"));
  };
  const changeSpeed = (step: 1 | -1) => announce(t("turntable.speed", { speed: tt.changeSpeed(step) }));
  const onKeyDown = useTurntableKeys({
    commands,
    nudge: tt.nudge,
    toggleRotation,
    speak: () => commands.speakAt(tt.needle()),
    selectRecord,
    stepRecord: (step) => selectRecord(stepRecord(state.track, step)),
    changeSpeed,
  });

  // Esc (global) leaves the turntable; keep keyboard focus on the page's map.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sectionRef.current?.contains(document.activeElement)) focusFlatMap();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto bg-night px-4 py-3 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:content-start"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div
          role="application"
          tabIndex={0}
          aria-roledescription={t("turntable.roleDescription")}
          aria-label={t("turntable.region", { record })}
          aria-describedby={instructionsId}
          onKeyDown={onKeyDown}
          className="relative"
        >
          <p id={instructionsId} className="sr-only">
            {t("turntable.instructions")}
          </p>
          <div ref={hostRef} {...pointer} className="relative aspect-[4/3] w-full touch-none select-none md:aspect-[16/10] lg:max-h-[60dvh]" />
          {debug && <DebugOverlay tt={tt} sendLog={sendLog} />}
        </div>
        <TurntableControls
          rotating={tt.rotating}
          speed={tt.speed}
          onToggleRotation={toggleRotation}
          onChangeSpeed={changeSpeed}
          onFlatMap={() => {
            commands.setMode("explore");
            focusFlatMap();
          }}
        />
        <Readout />
      </div>
      <RecordCarousel onSelect={selectRecord} className="lg:flex-col lg:overflow-visible" />
    </section>
  );
}
