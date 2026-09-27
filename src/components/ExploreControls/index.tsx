"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { readAt, readingText } from "@/lib/reading";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useMapKeys } from "./use-map-keys";

export const MAP_REGION_ID = "sound-map";

/**
 * The focusable sound map: role="application" so screen readers pass arrow
 * keys through (needs testing with NVDA and others). Its label is the text
 * alternative to the canvas and updates with the cursor, value and track.
 */
export function ExploreControls({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const commands = useCommands();
  const announce = useAnnounce();
  const t = useT();
  const onKeyDown = useMapKeys(commands);
  const instructionsId = useId();
  const regionRef = useRef<HTMLDivElement>(null);

  const reading = fields ? readAt(fields, state.cursor) : null;
  const trackName = t(state.track === "ocean" ? "track.oceanLong" : state.track === "rain" ? "track.rainLong" : "track.both");
  const label = reading
    ? t("map.alt", { track: trackName, reading: readingText(t, reading, state.track), place: t("place.latlon", state.cursor) })
    : t("start.loading");

  // Focus the map when the intro ends, so the keys work at once.
  useEffect(() => {
    if (state.introDone) regionRef.current?.focus();
  }, [state.introDone]);

  // Announce the settled reading after the cursor moves (debounced in the announcer).
  // With the built-in voice on, Enter speaks; moving still announces, since
  // nothing speaks at that moment.
  const settled = reading ? `${readingText(t, reading, state.track)}. ${t("place.latlon", state.cursor)}` : null;
  useEffect(() => {
    if (state.introDone && settled) announce(settled);
  }, [settled, state.introDone, announce]);

  return (
    <div
      id={MAP_REGION_ID}
      ref={regionRef}
      role="application"
      tabIndex={0}
      aria-roledescription={t("map.roleDescription")}
      aria-label={label}
      aria-describedby={instructionsId}
      onKeyDown={onKeyDown}
      className="relative"
    >
      <p id={instructionsId} className="sr-only">
        {t("map.instructions")}
      </p>
      {children}
    </div>
  );
}
