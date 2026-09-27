"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { readingText } from "@/lib/reading";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useMapKeys } from "./use-map-keys";

export const MAP_REGION_ID = "sound-map";

/**
 * The focusable sound map: role="application" so screen readers pass arrow
 * keys through (needs testing with NVDA and others). Its label is the text
 * alternative to the canvas and updates with the cursor, value and track.
 */
export function ExploreControls({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const commands = useCommands();
  const announce = useAnnounce();
  const t = useT();
  const onKeyDown = useMapKeys(commands);
  // Story Mode drives the map and narrates it; map keys and value announcements pause.
  const story = state.mode === "story";
  const instructionsId = useId();
  const regionRef = useRef<HTMLDivElement>(null);

  const { reading, cursor, track, timelapse } = useShownPoint();
  const trackName = t(track === "ocean" ? "track.oceanLong" : track === "rain" ? "track.rainLong" : "track.both");
  const label = reading
    ? t("map.alt", { track: trackName, reading: readingText(t, reading, track), place: t("place.latlon", cursor) })
    : t("start.loading");

  // Focus the map when the intro ends, so the keys work at once.
  useEffect(() => {
    if (state.introDone) regionRef.current?.focus();
  }, [state.introDone]);

  // Announce the settled reading after the cursor moves (debounced in the announcer).
  // With the built-in voice on, Enter speaks; moving still announces, since
  // nothing speaks at that moment.
  // Not during the time-lapse: a new frame every half second would flood the
  // screen reader (the time-lapse announces itself once when it starts).
  const settled = reading && !timelapse && !story ? `${readingText(t, reading, track)}. ${t("place.latlon", cursor)}` : null;
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
      onKeyDown={story ? undefined : onKeyDown}
      className="relative"
    >
      <p id={instructionsId} className="sr-only">
        {t("map.instructions")}
      </p>
      {children}
    </div>
  );
}
