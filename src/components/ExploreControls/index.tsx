"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { brailleRole } from "@/a11y/aria";
import { FLAGS } from "@/lib/flags";
import { readingText } from "@/lib/reading";
import { trackName, trackStatus } from "@/lib/track-status";
import { useAnnounce } from "../Announcer/use-announcer";
import { stepText } from "../AppState/access";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
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
  const shown = useShownPoint();
  const { onKeyDown, disarm, lead } = useMapKeys(commands, shown, state.stepDeg);
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
  // A frame held with PageUp/PageDown (step 2) is the user's own step: it announces like the live map.
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
    // A newly held frame (or the return to the live ones) leads, naming the frame; its own track change is part of it.
    const frameChanged = lastHeld.current !== heldIndex;
    lastHeld.current = heldIndex;
    const frame = !frameChanged ? null : held ? t("frames.held", { index: held.index + 1, total: held.total, timeUtc: held.timeUtc }) : t("frames.live");
    // After a track change the reading replaces the track's own status in the (debounced) live region, so it leads
    // with it: "Now hearing: Both. Frames rain 2d newer. 29.8 °C; …" (mentor item 1).
    const changed = lastTrack.current !== track && !frameChanged;
    lastTrack.current = track;
    // A region jump (J, then 1–9) leads with the region's name.
    const region = lead && lead.n !== usedLead.current ? lead.text : null;
    if (lead) usedLead.current = lead.n;
    // Sound-only steps (accessibility core) leave the status region to the sound; a track change still says so.
    const text = stepText(state) ? settled : null;
    const leads = [changed ? trackStatus(t, track, fields) : null, frame, region].filter((x) => x !== null);
    if (state.introDone && settled && !leftStory && (text || leads.length > 0)) announce([...leads, text].filter((x) => x !== null).join(" "));
    // t, fields and the held frame's details follow the language, data and frame, which change the settled text or index.
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
      aria-label={label}
      aria-describedby={instructionsId}
      onKeyDown={story ? undefined : onKeyDown}
      onBlur={disarm}
      className="group relative"
    >
      <p id={instructionsId} className="sr-only">
        {t(FLAGS.mapKeys ? "map.instructions.core" : "map.instructions")}
      </p>
      {children}
      {/* Help while focused (WCAG 2.1.4): the keys work only here (after a Tab or a click), and this says how to list them.
          The instructions above already say it to a screen reader. */}
      {FLAGS.mapKeys && (
        <p aria-hidden="true" className="glass-chip pointer-events-none absolute right-3 bottom-3 z-(--layer-map-plates) hidden rounded-full px-3 py-1 text-small text-moon group-focus:block">
          {t("map.focusHint")}
        </p>
      )}
    </div>
  );
}
