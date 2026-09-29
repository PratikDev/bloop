"use client";

import { createContext, useContext, type RefObject } from "react";
import type { PlayerHandle, SweepPoint, TrackMode } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";
import type { BoundT, Lang } from "@/lib/i18n";
import type { WhisperSource } from "@/lib/whisper";
import type { Mode, PanelTab } from "../AppState/reducer";

export type SettingKey = "describe" | "captions" | "reduceMotion" | "builtInVoice" | "allMuted";

export const SETTING_LABELS = {
  describe: "settings.describe",
  captions: "settings.captions",
  reduceMotion: "settings.reduceMotion",
  builtInVoice: "settings.builtInVoice",
  allMuted: "sound.muteAll",
} as const satisfies Record<SettingKey, string>;

export const MODE_LABELS = {
  home: "nav.home",
  explore: "mode.explore",
  story: "mode.story",
  thenNow: "mode.thenNow",
  how: "nav.how",
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
  enableSound(): Promise<void>;
  moveCursor(dLat: number, dLon: number): void;
  setTrack(track: TrackMode): void;
  setMode(mode: Mode): void;
  setLang(lang: Lang): void;
  toggleSetting(key: SettingKey): void;
  togglePlaying(): void;
  speakCurrent(): void;
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
  xray(): void;
  openPanel(panel: PanelTab): void;
  openHelp(): void;
  stopAll(): void;
  sweepRef: RefObject<SweepVisual | null>;
}

export const CommandsContext = createContext<Commands | null>(null);

export function useCommands(): Commands {
  const commands = useContext(CommandsContext);
  if (!commands) throw new Error("useCommands must be used inside <CommandsProvider>");
  return commands;
}
