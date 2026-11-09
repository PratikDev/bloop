"use client";

import { createContext, useContext, type RefObject } from "react";
import type { PlayerHandle, SweepPoint, TrackMode } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";
import type { BoundT, Lang } from "@/lib/i18n";
import type { WhisperSource } from "@/lib/whisper";
import type { Mode, PanelTab, ToggleKey } from "../AppState/reducer";

export type SettingKey = ToggleKey;

export const SETTING_LABELS = {
  describe: "settings.describe",
  captions: "settings.captions",
  reduceMotion: "settings.reduceMotion",
  builtInVoice: "settings.builtInVoice",
  allMuted: "sound.muteAll",
  hide3d: "access.hide3d",
} as const satisfies Record<SettingKey, string>;

export const MODE_LABELS = {
  home: "nav.home",
  explore: "mode.explore",
  story: "mode.story",
  thenNow: "mode.thenNow",
  how: "nav.how",
  turntable: "mode.turntable",
  official: "mode.official",
  team: "nav.team",
} as const satisfies Record<Mode, string>;

/** The sweep currently playing, for the map's sweep ring. */
export interface SweepVisual {
  center: LatLon;
  points: SweepPoint[];
  ring: number[]; // ring number of each point
  ringDeg: number[]; // radius of each ring, in degrees
}

/** A line to say, built for a language: once for the screen, once for speech. */
export type Line = (t: BoundT, lang: Lang) => string;

/** Every user action, shared by keyboard shortcuts and on-screen controls. */
export interface Commands {
  start(): Promise<void>;
  startSilent(): void;
  /** Forgets the sound choice (Home's reset): stops all sound, the Start buttons come back. */
  resetStart(): void;
  enableSound(): Promise<void>;
  moveCursor(dLat: number, dLon: number): void;
  /** Puts the cursor at an exact place (Go to); `remember` lets "." come back to where it was; `lead` (a region's or
   *  place's name) leads the map's announcement of the new place. */
  setCursor(cursor: LatLon, opts?: { remember?: boolean; lead?: string }): void;
  /** + (1) / − (−1): the next step size for the arrow keys (src/a11y/mapNav.ts), announced. */
  changeStep(dir: 1 | -1): void;
  /** ".": back to the needle's previous place, or says there is none. */
  goBack(): void;
  setTrack(track: TrackMode): void;
  setMode(mode: Mode): void;
  setLang(lang: Lang): void;
  toggleSetting(key: SettingKey): void;
  togglePlaying(): void;
  speakCurrent(): void;
  /** Speaks the value(s) and place at `at` (the turntable's needle). */
  speakAt(at: LatLon): void;
  /**
   * Speaks the line (built-in voice, with a caption) or announces it (screen reader), then, with
   * sound on, the satellite whisper with `source`'s caption. Resolves when it has been
   * said; a later say() or Esc cancels a pending whisper.
   */
  say(line: Line, source?: WhisperSource | null): Promise<void>;
  playSweep(): void;
  /** Starts the sweep from Chattogram with its map ring; null if there's nothing to play. */
  startSweep(): PlayerHandle | null;
  playLegend(): void;
  playMotif(): void;
  /** U: proof in unison (C1) at the checked point nearest the cursor (or the turntable's needle). */
  playUnison(): void;
  xray(): void;
  openPanel(panel: PanelTab): void;
  openHelp(): void;
  /** B: opens or closes the Braille Data Explorer (`open` forces one). */
  toggleBraille(open?: boolean): void;
  /** Esc: stops every sound and closes the panels; `leave` (default) also ends a story or leaves the turntable. */
  stopAll(opts?: { leave?: boolean }): void;
  sweepRef: RefObject<SweepVisual | null>;
}

export const CommandsContext = createContext<Commands | null>(null);

export function useCommands(): Commands {
  const commands = useContext(CommandsContext);
  if (!commands) throw new Error("useCommands must be used inside <CommandsProvider>");
  return commands;
}
