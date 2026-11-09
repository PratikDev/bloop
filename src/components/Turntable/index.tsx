"use client";

import { BookOpenText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDegrees, formatUtc } from "@/lib/i18n";
import { readAt } from "@/lib/reading";
import { liveSoundOn } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { CaptionBar } from "../CaptionBar";
import { useCommands } from "../Commands/use-commands";
import { MAP_REGION_ID } from "../ExploreControls";
import { useLiveData } from "../LiveData/use-live-data";
import { CreditsLink } from "./CreditsLink";
import { Dock } from "./Dock";
import { Drawers, type DrawerId } from "./Drawers";
import { ttFor, useTT } from "./i18n";
import { graticuleLabels, type PlacedLabels } from "./LabelLayer";
import { labelCandidates } from "./labels";
import { LegendBar } from "./LegendBar";
import { useDetails } from "./NeedleChip/use-details";
import type { SentReading } from "./needle-sound";
import { placeText } from "./place-text";
import { RECORD_LABELS, recordFrames } from "./records";
import { SearchBox } from "./SearchBox";
import { DEFAULT_SETTINGS, layerToggles, type TurntableSettings } from "./settings";
import { Stage } from "./Stage";
import { useGeo } from "./use-geo";
import { introWanted, useIntro } from "./use-intro";
import { useTurntable } from "./use-turntable";
import { useTurntableActions } from "./use-turntable-actions";
import { useTurntableKeys } from "./use-turntable-keys";
import type { SceneId } from "../Scenes/registry";
import { SceneHost } from "../Scenes/SceneHost";

const SEND_LOG_MAX = 5000;
const IDLE_MS = 30_000;
const IDLE_CHECK_MS = 5_000;
const GLASS_BUTTON = "glass-chip pointer-events-auto h-11 gap-2 rounded-full px-4 text-body text-moon";

/** After leaving, keyboard focus lands on the flat map rather than the page. */
const focusFlatMap = () => requestAnimationFrame(() => document.getElementById(MAP_REGION_ID)?.focus());

/**
 * Turntable Earth: the latest EIC frame over a realistic globe on a turntable.
 * The needle is the app's cursor and the records are its tracks, so the value,
 * captions, speech and panels are the flat map's own; the globe, places and
 * motion are presentation only. The screen stays calm: the globe, a needle
 * chip, a slim legend and one dock; everything else opens on demand.
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
  const dockRef = useRef<HTMLDivElement>(null);
  const [debug] = useState(() => new URLSearchParams(window.location.search).get("debug") === "1");
  const sendLog = useRef<SentReading[]>([]);
  const placed = useRef<PlacedLabels>(new Map());
  const [start] = useState(state.cursor);
  const [introPending] = useState(() => introWanted(state.reduceMotion));
  const settingsState = useState<TurntableSettings>(DEFAULT_SETTINGS);
  const settings = settingsState[0];
  const [drawer, setDrawer] = useState<DrawerId | null>(null);
  const [sceneOpen, setSceneOpen] = useState<SceneId | null>(null);
  const details = useDetails();
  const record = tr(RECORD_LABELS[state.track]);
  const frameTime = recordFrames(state.track, fields)[0]?.meta.frame_time_utc ?? null;

  const tt = useTurntable({
    hostRef,
    label: { title: record, subtitle: frameTime ? tr("turntable.frameTime", { datetime: formatUtc(frameTime, state.lang) }) : "" },
    track: state.track,
    fields,
    liveOn: liveSoundOn(state),
    allMuted: state.allMuted,
    reduceMotion: state.reduceMotion,
    layers: layerToggles(settings),
    introPending,
    paused: sceneOpen !== null,
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
      frameTime,
      sunTime: settings.sunAtFrameTime ? frameTime : null,
      dataOpacity: settings.dataOpacity,
      geo,
    },
  });
  const intro = useIntro(tt, introPending);
  const actions = useTurntableActions(tt, geo, searchRef, settingsState);

  const onKeyDown = useTurntableKeys({
    commands,
    nudge: tt.nudge,
    toggleRotation: actions.toggleRotation,
    speak() {
      actions.speak();
      details.show();
    },
    stepRecord: actions.stepRecord,
    changeSpeed: actions.changeSpeed,
    zoom: actions.zoom,
    focusSearch: actions.focusSearch,
    whereAmI: actions.whereAmI,
    bookmark: actions.bookmark,
    toggleTour: actions.toggleTour,
    toggleCamera: () => actions.setCameraMode(tt.cameraMode === "explore" ? "jukebox" : "explore"),
    stepOpacity: actions.stepOpacity,
    toggleDetails: details.toggle,
    focusDock: () => dockRef.current?.querySelector("button")?.focus(),
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

  // A scene record: the record swap plays, then the scene opens over the turntable (which pauses).
  const openScene = (id: SceneId) => {
    void tt.changeRecord().then(() => setSceneOpen(id));
  };
  const closeScene = () => {
    setSceneOpen(null);
    requestAnimationFrame(() => hostRef.current?.parentElement?.focus());
  };

  // Esc (global) leaves the turntable; keep keyboard focus on the page's map.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && sectionRef.current?.contains(document.activeElement)) focusFlatMap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section ref={sectionRef} lang={rootLang} className="tt-warm relative min-h-[32rem] min-w-0 overflow-hidden bg-tt-black">
      <div inert={sceneOpen !== null} className="contents">
        <Stage
          tt={tt}
          hostRef={hostRef}
          geo={geo}
          record={record}
          tier={settings.quality}
          place={place}
          labels={settings.labels ? labels : null}
          graticule={graticule}
          details={details}
          intro={intro.phase}
          idle={idle}
          onKeyDown={onKeyDown}
          debug={debug ? { sendLog, placed } : null}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute top-3 right-3 left-3 flex items-start justify-end gap-2 pt-6 sm:pt-0">
          <SearchBox gazetteer={geo?.gazetteer ?? null} onChoose={actions.choosePlace} inputRef={searchRef} className="pointer-events-auto max-w-[calc(100%-3.5rem)]" />
          <Button variant="ghost" onClick={() => setDrawer("howWeKnow")} className={GLASS_BUTTON}>
            <BookOpenText aria-hidden="true" />
            <span className="hidden sm:inline">{tr("turntable.howWeKnow")}</span>
            <span className="sr-only sm:hidden">{tr("turntable.howWeKnow")}</span>
          </Button>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
          <div className="max-w-2xl text-center">
            <CaptionBar fade className="min-h-0 text-body [text-shadow:0_1px_3px_var(--label-shadow)] sm:text-lead" />
            {actions.where && (
              <p key={actions.where} className="caption-fade text-body text-moon [text-shadow:0_1px_3px_var(--label-shadow)]">
                {actions.where}
              </p>
            )}
          </div>
          <LegendBar
            pixel={fields ? tt.texture.sample(state.track, readAt(fields, state.cursor), state.cursor) : null}
            className="pointer-events-auto w-full max-w-md"
          />
          <div className="pointer-events-auto max-w-full">
            <Dock
              ref={dockRef}
              rotating={tt.rotating}
              speed={tt.speed}
              touring={actions.touring}
              cameraMode={tt.cameraMode}
              covers={tt.texture.covers}
              onPlay={commands.togglePlaying}
              onToggleRotation={actions.toggleRotation}
              onSpeed={actions.changeSpeed}
              onSearch={actions.focusSearch}
              onWhereAmI={actions.whereAmI}
              onTour={actions.toggleTour}
              onRecord={actions.selectRecord}
              onScene={openScene}
              onCameraMode={actions.setCameraMode}
              onLayers={() => setDrawer("layers")}
              onSettings={() => setDrawer("settings")}
              onHelp={commands.openHelp}
            />
          </div>
        </div>
        <CreditsLink className="absolute right-2 bottom-2 hidden h-8 px-2 text-small text-haze lg:inline-flex" />
        <Drawers
          open={drawer}
          onClose={() => setDrawer(null)}
          settings={settings}
          update={actions.updateSettings}
          onMyLocation={actions.myLocation}
          onFlatMap={() => {
            setDrawer(null);
            commands.setMode("explore");
            focusFlatMap();
          }}
        />
      </div>
      {sceneOpen && <SceneHost id={sceneOpen} onExit={closeScene} tier={settings.quality} geo={geo} />}
    </section>
  );
}
