"use client";

import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";
import { bindT, formatUtc, type Lang } from "@/lib/i18n";
import type { SearchEntry, ZoomLevel } from "@/lib/geo/search";
import { readAt, readingText, spokenValue } from "@/lib/reading";
import { whisperSource } from "@/lib/whisper";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { ttFor } from "./i18n";
import { localName, placeText } from "./place-text";
import { FRAME_PRODUCT_LABELS, RECORD_LABELS, recordFrames, stepRecord } from "./records";
import type { ToolbarSettings } from "./Toolbar";
import type { Geo } from "./use-geo";
import { useTour } from "./use-tour";
import type { Turntable } from "./use-turntable";

/** Opacity steps for the O key (default 85%, as the data layer starts). */
const OPACITY_STEPS = [0, 0.25, 0.5, 0.85, 1] as const;
export const DEFAULT_SETTINGS: ToolbarSettings = { dataOpacity: 0.85, sunAtFrameTime: true, graticule: false, quality: null };

export function useTurntableActions(
  tt: Turntable,
  geo: Geo | null,
  searchRef: RefObject<HTMLInputElement | null>,
  [settings, setSettings]: [ToolbarSettings, Dispatch<SetStateAction<ToolbarSettings>>],
) {
  const { state, dispatch } = useAppState();
  const { fields } = useLiveData();
  const commands = useCommands();
  const announce = useAnnounce();
  const [where, setWhere] = useState<string | null>(null);
  const lang = state.lang;
  const t = bindT(lang);
  const tr = ttFor(lang);

  const placeAt = (at: LatLon, l: Lang, spoken = false) => (geo ? placeText(ttFor(l), l, geo.gazetteer.whereAmI(at), spoken) : null);
  const readingHere = (at: LatLon) => (fields ? readingText(t, readAt(fields, at), state.track) : "");

  /** Enter: value + unit + place + frame time, through the app's speech path (built-in voice or live region). */
  const speak = () => {
    if (!fields) return Promise.resolve();
    const at = tt.needle();
    const frames = recordFrames(state.track, fields);
    return commands.say((tl, l) => {
      const value = spokenValue(tl, readAt(fields, at), state.track);
      const place = placeAt(at, l, true)?.line ?? tl("place.spoken", at);
      const datetime = frames.map((f) => formatUtc(f.meta.frame_time_utc, l)).join(" / ");
      return ttFor(l)("turntable.speak", { value, place, latlon: tl("place.spoken", at), datetime });
    }, whisperSource(t, fields, state.track));
  };

  const whereAmI = () => {
    const at = tt.needle();
    const line = placeAt(at, lang)?.line ?? t("place.latlon", at);
    setWhere(line);
    announce(`${line}. ${readingHere(at)}. ${t("place.latlon", at)}`);
  };

  const flyAndAnnounce = async (at: LatLon, zoom: ZoomLevel, name: string) => {
    const arrived = await tt.flyTo(at, zoom);
    if (!arrived) return false;
    const here = tt.needle();
    const line = placeAt(here, lang)?.line ?? name;
    setWhere(line);
    announce(tr("turntable.arrived", { place: line, reading: readingHere(here) }));
    return true;
  };

  const selectRecord = (track: TrackMode) => {
    dispatch({ type: "setTrack", track });
    const frames = recordFrames(track, fields)
      .map((f) => tr("turntable.announce.frame", { product: t(FRAME_PRODUCT_LABELS[f.product]), datetime: formatUtc(f.meta.frame_time_utc, lang) }))
      .join(" ");
    announce(tr("turntable.announce.record", { record: tr(RECORD_LABELS[track]), frames }));
  };

  const tour = useTour(
    geo && {
      stops: geo.gazetteer.tour,
      fly: (stop) => tt.flyTo(stop, stop.zoom),
      arrive: (stop, index, total) => announce(tr("turntable.tour.at", { index, total, place: localName({ name: stop.name, nameBn: stop.name_bn }, lang).text })),
      speak,
      stopped: () => announce(tr("turntable.tour.stop.announce")),
      done: () => announce(tr("turntable.tour.done")),
    },
  );

  return {
    where,
    touring: tour.touring,
    updateSettings: (next: Partial<ToolbarSettings>) => setSettings((s) => ({ ...s, ...next })),
    speak: () => void speak(),
    whereAmI,
    selectRecord,
    stepRecord: (step: 1 | -1) => selectRecord(stepRecord(state.track, step)),
    toggleRotation() {
      tt.setRotating(!tt.rotating);
      announce(tr(tt.rotating ? "turntable.announce.stoppedTurning" : "turntable.announce.turning"));
    },
    changeSpeed: (step: 1 | -1) => announce(tr("turntable.speed", { speed: tt.changeSpeed(step) })),
    zoom: (step: 1 | -1) => tt.zoomBy(step > 0 ? 0.7 : 1 / 0.7),
    setCameraMode(mode: "jukebox" | "explore") {
      tt.setCameraMode(mode);
      announce(tr("turntable.announce.view", { view: tr(mode === "explore" ? "turntable.view.explore" : "turntable.view.jukebox") }));
    },
    stepOpacity() {
      const next = OPACITY_STEPS.find((s) => s > settings.dataOpacity + 0.001) ?? OPACITY_STEPS[0];
      setSettings((s) => ({ ...s, dataOpacity: next }));
      announce(tr("turntable.opacity.value", { percent: Math.round(next * 100) }));
    },
    focusSearch: () => searchRef.current?.focus(),
    choosePlace(entry: SearchEntry) {
      void flyAndAnnounce(entry, entry.zoom, entry.name);
    },
    bookmark(n: number) {
      const b = geo?.gazetteer.bookmarks[n - 1];
      if (b) void flyAndAnnounce(b, b.zoom, b.name);
    },
    toggleTour: tour.toggle,
    myLocation() {
      if (!("geolocation" in navigator)) {
        announce(tr("turntable.myLocation.unsupported"));
        return;
      }
      // Used once for this flight; never stored or sent anywhere.
      navigator.geolocation.getCurrentPosition(
        (pos) => void flyAndAnnounce({ lat: pos.coords.latitude, lon: pos.coords.longitude }, "local", ""),
        () => announce(tr("turntable.myLocation.denied")),
        { maximumAge: 0, timeout: 10000 },
      );
    },
  };
}

export type TurntableActions = ReturnType<typeof useTurntableActions>;
