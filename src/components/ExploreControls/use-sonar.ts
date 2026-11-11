"use client";

import { useEffect, useRef } from "react";
import { audio } from "@/lib/audio-adapter";
import type { LatLon } from "@/lib/data";
import { liveRainFrame, sstGrid } from "@/lib/describe/facts";
import type { Extreme, ValueGrid } from "@/lib/describe/stats";
import { loadGeo } from "@/lib/geo/load";
import { oceanText, rainText } from "@/lib/reading";
import { FLAGS } from "@/lib/flags";
import { arrived, closeness, pingIntervalMs, sonarTarget } from "@/lib/sonar";
import { sonarTrend } from "@/lib/sound-captions";
import { postCaption } from "@/lib/ui-captions";
import { sonarShort } from "@/a11y/shortForms";
import { useShortLines } from "@/hooks/use-short-lines";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { placeText } from "../Turntable/place-text";
import { ttFor } from "../Turntable/i18n";

interface Hunt {
  target: Extreme;
  kind: "ocean" | "rain";
  cellDeg: number;
}

export function useSonar(): () => void {
  const { state, dispatch } = useAppState();
  const commands = useCommands();
  const announce = useAnnounce();
  const shortLines = useShortLines();
  const t = useT();
  const { fields } = useLiveData();
  const hunt = useRef<Hunt | null>(null);
  const cursor = useRef<LatLon>(state.cursor);
  useEffect(() => {
    cursor.current = state.cursor;
  }, [state.cursor]);

  useEffect(() => {
    if (!state.sonar) return;
    let id: ReturnType<typeof setTimeout>;
    let last: number | null = null;
    const ping = () => {
      const h = hunt.current;
      if (!h) return;
      const c = closeness(cursor.current, h.target);
      if (state.soundOn) audio.playSonarPing(c, cursor.current.lon);
      if (state.soundOn && FLAGS.timedText) postCaption("caption.sonar.ping", { trend: sonarTrend(last, c) });
      last = c;
      id = setTimeout(ping, pingIntervalMs(c));
    };
    ping();
    return () => clearTimeout(id);
  }, [state.sonar, state.soundOn]);

  useEffect(() => {
    const h = hunt.current;
    if (!state.sonar || !h || !arrived(state.cursor, h.target, state.stepDeg, h.cellDeg)) return;
    dispatch({ type: "setSonar", on: false });
    const what = t(h.kind === "ocean" ? "sonar.warmest" : "sonar.wettest");
    const value =
      h.kind === "ocean"
        ? oceanText(t, { track: "ocean", valueC: h.target.value })
        : rainText(t, { track: "rain", mmPerHour: h.target.value, phase: "liquid" }, true);
    void loadGeo()
      .then((geo) => placeText(ttFor(state.lang), state.lang, geo.gazetteer.whereAmI(h.target), true).line)
      .catch(() => t("place.spoken", h.target))
      .then((place) => {
        const text = t("sonar.arrived", { what, value, place });
        const time = (h.kind === "ocean" ? fields?.sst.meta.frame_time_utc : fields?.rain?.meta.frame_time_utc) ?? "";
        announce(shortLines.on ? sonarShort(t, state.lang, shortLines.degree, { record: h.kind, value: h.target.value, frozen: false, at: h.target, timeUtc: time }) : text);
        commands.note(text, [h.kind === "ocean" ? (fields?.sst.meta.source_dataset ?? "") : (fields?.rain?.meta.source_dataset ?? "")].filter(Boolean));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cursor, state.sonar]);

  return () => {
    if (state.sonar) {
      dispatch({ type: "setSonar", on: false });
      announce(t("sonar.stopped"));
      return;
    }
    if (!fields) return;
    const kind = state.track === "rain" && fields.rain ? "rain" : "ocean";
    const grid: ValueGrid = kind === "rain" && fields.rain ? liveRainFrame(fields.rain).grid : sstGrid(fields.sst);
    const target = sonarTarget(grid, state.cursor);
    if (!target) {
      announce(t("sonar.none"));
      return;
    }
    hunt.current = { target, kind, cellDeg: 360 / grid.width };
    dispatch({ type: "setSonar", on: true });
    announce(t("sonar.start", { what: t(kind === "ocean" ? "sonar.warmest" : "sonar.wettest") }));
  };
}
