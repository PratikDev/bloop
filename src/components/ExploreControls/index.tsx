"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { brailleRole } from "@/a11y/aria";
import { FLAGS } from "@/lib/flags";
import { loadGeo } from "@/lib/geo/load";
import { readingText } from "@/lib/reading";
import { trackName, trackStatus } from "@/lib/track-status";
import { useAnnounce } from "../Announcer/use-announcer";
import { stepText } from "../AppState/access";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useHeldName } from "./use-held-name";
import { useMapKeys } from "./use-map-keys";

export const MAP_REGION_ID = "sound-map";

const preloadGeo = () => void loadGeo().catch(() => undefined);

export function ExploreControls({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const commands = useCommands();
  const announce = useAnnounce();
  const t = useT();
  const shown = useShownPoint();
  const { onKeyDown, disarm } = useMapKeys(commands, shown, state.stepDeg);
  const { lead } = state;
  // Story Mode drives the map and narrates it; map keys and value announcements pause.
  const story = state.mode === "story";
  const instructionsId = useId();
  const regionRef = useRef<HTMLDivElement>(null);

  const { reading, cursor, track, timelapse } = shown;
  const { fields } = useLiveData();
  const trackLabel = trackName(t, track);
  const label = reading
    ? t("map.alt", { track: trackLabel, reading: readingText(t, reading, track), place: t("place.latlon", cursor) })
    : t("start.loading");
  const mapName = useHeldName(label, Boolean(reading));

  // Focus the map when the intro ends, so the keys work at once.
  useEffect(() => {
    if (state.introDone) regionRef.current?.focus();
  }, [state.introDone]);

  // Announce the settled reading after the cursor moves (debounced in the announcer).
  // With the built-in voice on, Enter speaks; moving still announces, since
  // nothing speaks at that moment.
  // Not during the time-lapse: a new frame every half second would flood the
  // screen reader (the time-lapse announces itself once when it starts).
  // Nor right after the story ends: its own "Story stopped" message stays the last word.
  const held = timelapse?.held ? timelapse : null;
  const settled = reading && (!timelapse || held) && !story ? `${readingText(t, reading, track)}. ${t("place.latlon", cursor)}` : null;
  const wasStory = useRef(story);
  const lastTrack = useRef(track);
  const lastHeld = useRef<number | null>(null);
  const usedLead = useRef(0);
  const heldIndex = held?.index ?? null;
  useEffect(() => {
    const leftStory = wasStory.current && !story;
    wasStory.current = story;
    const frameChanged = lastHeld.current !== heldIndex;
    lastHeld.current = heldIndex;
    const frame = !frameChanged ? null : held ? t("frames.held", { index: held.index + 1, total: held.total, timeUtc: held.timeUtc }) : t("frames.live");
    const changed = lastTrack.current !== track && !frameChanged;
    lastTrack.current = track;
    const region = lead && lead.n !== usedLead.current ? lead.text : null;
    if (lead) usedLead.current = lead.n;
    const text = stepText(state) ? settled : null;
    const leads = [changed ? trackStatus(t, track, fields) : null, frame, region].filter((x) => x !== null);
    if (state.introDone && settled && !leftStory && (text || leads.length > 0)) announce([...leads, text].filter((x) => x !== null).join(" "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, heldIndex, lead, state.introDone, state.channels, story, announce]);

  return (
    <div
      id={MAP_REGION_ID}
      ref={regionRef}
      role="application"
      tabIndex={0}
      aria-roledescription={t("map.roleDescription")}
      {...brailleRole(t("braille.bl.map"))}
      aria-label={mapName.name}
      data-reading={label}
      aria-describedby={instructionsId}
      onKeyDown={story ? undefined : onKeyDown}
      onBlur={(e) => {
        mapName.onBlur(e);
        disarm();
      }}
      onFocus={(e) => {
        mapName.onFocus(e);
        if (FLAGS.describe) preloadGeo();
      }}
      className="group relative"
    >
      <p id={instructionsId} className="sr-only">
        {t(FLAGS.mapKeys ? "map.instructions.core" : "map.instructions")}
      </p>
      {children}
      {}
      {FLAGS.mapKeys && (
        <p aria-hidden="true" className="glass-chip pointer-events-none absolute right-3 bottom-3 z-(--layer-map-plates) hidden rounded-full px-3 py-1 text-small text-moon group-focus:block">
          {t("map.focusHint")}
        </p>
      )}
    </div>
  );
}
