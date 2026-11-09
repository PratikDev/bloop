"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { centreOf, REGION_LABEL, regionOf, WHOLE_MAP, type Bounds } from "@/a11y/mapNav";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { FLAGS } from "@/lib/flags";
import { useLensKeys } from "../LowVision/use-lens-keys";
import { spokenReading } from "@/lib/reading";
import { useAnnounce } from "../Announcer/use-announcer";
import { useT } from "../AppState/use-app-state";
import type { Commands } from "../Commands/use-commands";
import type { ShownPoint } from "../TimeLapse/use-shown-point";
import { useDescribeHere } from "../Describe/use-describe-here";
import { useSayProvenance } from "../Tuning/use-say-provenance";
import { useSonar } from "./use-sonar";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";

export const STEP_DEG = 1;
export const BIG_STEP_DEG = 10;

/** Arrow key → [dLat, dLon] direction (shared with the turntable). */
export const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [1, 0],
  ArrowDown: [-1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export const TRACK_KEYS: Record<string, TrackMode> = {
  "1": "ocean",
  "2": "rain",
  "3": "both",
};

/** + and − on the main keyboard (= and _ are the same keys unshifted/shifted); the numpad's, if a screen reader lets them through. */
export const GROW_KEYS = new Set(["+", "="]);
export const SHRINK_KEYS = new Set(["-", "_", "−"]);
/** A modifier pressed on its own (Shift on the way to +) is not a key of its own. */
const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);

export interface MapKeys {
  onKeyDown(e: KeyboardEvent<HTMLElement>): void;
  /** Ends the J region mode (the map lost focus). */
  disarm(): void;
}

/**
 * Keys that only work while the map region has focus (plan §9.3), so single letters never clash with screen reader
 * navigation (WCAG 2.1.4; the NVDA/JAWS check is in docs/accessibility/CORE_PLAN.md). Esc is handled globally, not
 * here. G is reserved for the game. With FLAGS.mapKeys (accessibility core, step 2): + and − set the step, J then 1–9
 * jumps by region, "." goes back, PageUp/PageDown hold a newer/older rain frame, D describes here and Shift+D toggles
 * Describe mode.
 */
export function useMapKeys(commands: Commands, shown: ShownPoint, stepDeg: number): MapKeys {
  const { stepFrame } = useTimeLapse();
  const describeHere = useDescribeHere();
  const sayProvenance = useSayProvenance();
  const sonar = useSonar();
  const announce = useAnnounce();
  const t = useT();
  // The J region mode's current view; null when it is off.
  const regions = useRef<Bounds | null>(null);
  const disarm = useCallback(() => {
    regions.current = null;
  }, []);

  const lens = useLensKeys();
  const held = shown.timelapse?.held ? shown.timelapse : null;
  // Enter and D: the value here, in the frame on screen (a held frame says which one first).
  const speakHere = () => {
    if (!held || !shown.reading) return commands.speakCurrent();
    const { reading, cursor } = shown;
    void commands.say(
      (tl) =>
        `${tl("frames.held", { index: held.index + 1, total: held.total, timeUtc: held.timeUtc })} ${spokenReading(tl, reading, "rain", cursor)}`,
    );
  };

  const coreAction = (e: KeyboardEvent<HTMLElement>): (() => void) | null => {
    const view = regions.current;
    const region = view ? regionOf(view, e.key) : null;
    if (region) {
      return () => {
        regions.current = region.bounds;
        const lead = t("map.region", { n: Number(e.key), name: t(REGION_LABEL[region.name]) });
        commands.setCursor(centreOf(region.bounds), { remember: true, lead });
      };
    }
    regions.current = null; // any other key ends the region mode
    if (e.key === "j" || e.key === "J") {
      return () => {
        regions.current = WHOLE_MAP;
        announce(t("map.regions"));
      };
    }
    if (GROW_KEYS.has(e.key)) return () => commands.changeStep(1);
    if (SHRINK_KEYS.has(e.key)) return () => commands.changeStep(-1);
    switch (e.key) {
      case ".":
        return commands.goBack;
      case "PageUp":
        return () => void stepFrame(1);
      case "PageDown":
        return () => void stepFrame(-1);
      case "Enter":
        return speakHere;
      case "d":
        // Step 3: the layered description; without it (or before the frames load), the value here.
        return FLAGS.describe && describeHere ? describeHere : speakHere;
      case "D":
        return () => commands.toggleSetting("describe");
      case "n":
      case "N":
        // Step 6: the sonar toward the warmest or wettest spot near the needle; N again stops it.
        return FLAGS.expedition ? sonar : null;
      case "P":
        // Step 5: the record's source in one line (plain P still opens Where it's from).
        return FLAGS.tuning ? sayProvenance : null;
      case "z":
      case "Z":
        // Step 8: the Context Lens on or off; [ and ] resize it (they only mean speed on the Turntable).
        return FLAGS.lowVision ? lens.toggle : null;
      case "[":
        return FLAGS.lowVision ? () => lens.resize(-1) : null;
      case "]":
        return FLAGS.lowVision ? () => lens.resize(1) : null;
      default:
        return null;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || MODIFIERS.has(e.key)) return;
    const core = FLAGS.mapKeys ? coreAction(e) : null;
    const arrow = ARROWS[e.key];
    if (core) {
      core();
    } else if (arrow) {
      const step = e.shiftKey ? BIG_STEP_DEG : FLAGS.mapKeys ? stepDeg : STEP_DEG;
      commands.moveCursor(arrow[0] * step, arrow[1] * step);
    } else if (TRACK_KEYS[e.key]) {
      commands.setTrack(TRACK_KEYS[e.key]);
    } else {
      const action = letterAction(commands, e.key);
      if (!action) return;
      action();
    }
    e.preventDefault();
  };

  return { onKeyDown, disarm };
}

/** The map's letter keys (also used by the turntable for the keys it doesn't redefine). */
export function letterAction(c: Commands, key: string): (() => void) | null {
  switch (key.toLowerCase()) {
    case "enter":
      return c.speakCurrent;
    case " ":
      return c.togglePlaying;
    case "s":
      return c.playSweep;
    case "m":
      return () => c.toggleSetting("allMuted");
    case "d":
      return () => c.toggleSetting("describe");
    case "c":
      return () => c.toggleSetting("captions");
    case "t":
      return () => c.setMode("thenNow");
    case "l":
      return c.playLegend;
    case "p":
      return () => c.openPanel("provenance");
    case "x":
      return c.xray;
    case "u":
      return c.playUnison;
    case "h":
    case "?":
      return c.openHelp;
    case "b":
      return c.toggleBraille;
    default:
      return null;
  }
}
