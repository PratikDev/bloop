"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../AppState/use-app-state";
import { liveSoundOn } from "../AppState/reducer";
import { useCommands } from "../Commands/use-commands";
import { MAP_REGION_ID } from "../ExploreControls";
import { useLiveData } from "../LiveData/use-live-data";
import { formatDegrees } from "@/lib/i18n";
import { readAt } from "@/lib/reading";
import { ttFor, useTT } from "./i18n";
import { labelCandidates } from "./labels";
import { graticuleLabels, type PlacedLabels } from "./LabelLayer";
import { LegendBar } from "./LegendBar";
import type { SentReading } from "./needle-sound";
import { placeText } from "./place-text";
import { ReadoutCard } from "./ReadoutCard";
import { RECORD_LABELS, recordFrames } from "./records";
import { SearchBox } from "./SearchBox";
import { SleeveRow } from "./SleeveRow";
import { Stage } from "./Stage";
import { Toolbar, type ToolbarSettings } from "./Toolbar";
import { useGeo } from "./use-geo";
import { useTurntable } from "./use-turntable";
import { DEFAULT_SETTINGS, useTurntableActions } from "./use-turntable-actions";
import { useTurntableKeys } from "./use-turntable-keys";

const SEND_LOG_MAX = 5000;
const IDLE_MS = 30_000;
const IDLE_CHECK_MS = 5_000;

/** After leaving, keyboard focus lands on the flat map rather than the page. */
const focusFlatMap = () => requestAnimationFrame(() => document.getElementById(MAP_REGION_ID)?.focus());

/**
 * Turntable Earth: the latest EIC frame over a realistic globe on a turntable.
 * The needle is the app's cursor and the records are its tracks, so readout,
 * captions, speech and panels are the flat map's own; the globe, places and
 * motion are presentation only.
 */
export function Turntable() {
  const { state, dispatch } = useAppState();
  const { fields } = useLiveData();
  const commands = useCommands();
  const { tt: tr, lang, rootLang } = useTT();
  const geo = useGeo();
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [debug] = useState(() => new URLSearchParams(window.location.search).get("debug") === "1");
  const sendLog = useRef<SentReading[]>([]);
  const placed = useRef<PlacedLabels>(new Map());
  const [start] = useState(state.cursor);
  const [now] = useState(Date.now);
  const settingsState = useState<ToolbarSettings>(DEFAULT_SETTINGS);
  const settings = settingsState[0];
  const record = tr(RECORD_LABELS[state.track]);
  const sunTime = recordFrames(state.track, fields)[0]?.meta.frame_time_utc ?? null;

  const tt = useTurntable({
    hostRef,
    canvasLabel: tr("turntable.canvas", { record }),
    track: state.track,
    fields,
    liveOn: liveSoundOn(state),
    allMuted: state.allMuted,
    reduceMotion: state.reduceMotion,
    graticule: settings.graticule,
    start,
    dispatch,
    onSend: debug
      ? (sent) => {
          sendLog.current.push(sent);
          if (sendLog.current.length > SEND_LOG_MAX) sendLog.current.shift();
        }
      : undefined,
    scene: {
      quality: settings.quality,
      sunTime: settings.sunAtFrameTime ? sunTime : null,
      dataOpacity: settings.dataOpacity,
      geo,
    },
  });
  const actions = useTurntableActions(tt, geo, searchRef, settingsState);

  const onKeyDown = useTurntableKeys({
    commands,
    nudge: tt.nudge,
    toggleRotation: actions.toggleRotation,
    speak: actions.speak,
    stepRecord: actions.stepRecord,
    changeSpeed: actions.changeSpeed,
    zoom: actions.zoom,
    focusSearch: actions.focusSearch,
    whereAmI: actions.whereAmI,
    bookmark: actions.bookmark,
    toggleTour: actions.toggleTour,
    toggleCamera: () => actions.setCameraMode(tt.cameraMode === "explore" ? "jukebox" : "explore"),
    stepOpacity: actions.stepOpacity,
    skipAnimation: tt.skipAnimation,
  });

  const labels = useMemo(() => (geo ? labelCandidates(geo.files, geo.gazetteer, lang) : []), [geo, lang]);
  const graticule = useMemo(() => {
    if (!settings.graticule) return null;
    const tl = ttFor(lang);
    return graticuleLabels(
      { equator: tl("turntable.graticule.equator"), cancer: tl("turntable.graticule.cancer"), capricorn: tl("turntable.graticule.capricorn") },
      (lat) => `${formatDegrees(lat, lang)}° ${lat >= 0 ? "N" : "S"}`,
    );
  }, [settings.graticule, lang]);
  const place = geo ? placeText(tr, lang, geo.gazetteer.whereAmI(state.cursor)).line : null;

  // The idle hint: after 30 s without input on the turntable.
  const [idle, setIdle] = useState(false);
  const { lastInput } = tt;
  useEffect(() => {
    const id = setInterval(() => setIdle(performance.now() - lastInput() > IDLE_MS), IDLE_CHECK_MS);
    return () => clearInterval(id);
  }, [lastInput]);

  // Esc (global) leaves the turntable; keep keyboard focus on the page's map.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && sectionRef.current?.contains(document.activeElement)) focusFlatMap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      ref={sectionRef}
      lang={rootLang}
      className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 overflow-x-hidden overflow-y-auto bg-night p-3 lg:grid-cols-[minmax(0,1fr)_21rem] lg:content-stretch lg:overflow-hidden"
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <SearchBox gazetteer={geo?.gazetteer ?? null} onChoose={actions.choosePlace} inputRef={searchRef} />
        <Stage
          tt={tt}
          hostRef={hostRef}
          geo={geo}
          record={record}
          place={place}
          labels={labels}
          graticule={graticule}
          idle={idle}
          onKeyDown={onKeyDown}
          debug={debug ? { sendLog, placed } : null}
          className="aspect-square w-full sm:aspect-[4/3] lg:aspect-auto lg:min-h-80 lg:flex-1"
        />
        <ReadoutCard place={place} now={now} className="w-full md:hidden" />
      </div>
      {/* The legend heads the side column, so on wide screens the globe keeps the full height. */}
      <aside className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
        <LegendBar pixel={fields ? tt.texture.sample(state.track, readAt(fields, state.cursor), state.cursor) : null} />
        {actions.where && <p className="rounded-lg border border-haze px-3 py-2 text-body text-moon">{actions.where}</p>}
        <Toolbar
          rotating={tt.rotating}
          speed={tt.speed}
          cameraMode={tt.cameraMode}
          touring={actions.touring}
          settings={settings}
          onToggleRotation={actions.toggleRotation}
          onSpeed={actions.changeSpeed}
          onZoom={actions.zoom}
          onCameraMode={actions.setCameraMode}
          onTour={actions.toggleTour}
          onMyLocation={actions.myLocation}
          onWhereAmI={actions.whereAmI}
          onFlatMap={() => {
            commands.setMode("explore");
            focusFlatMap();
          }}
          onSettings={actions.updateSettings}
        />
        <SleeveRow covers={tt.texture.covers} onSelect={actions.selectRecord} />
        {/* Attribution stays English (names and licences). */}
        <p lang="en" className="border-t border-haze pt-3 text-body text-haze">
          {tr("turntable.credits")}
        </p>
      </aside>
    </section>
  );
}
