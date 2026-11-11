import { type LiveVoiceId, type TrackMode } from "@/lib/audio-adapter/types";
import { type LogEntry } from "@/lib/expedition-log";
import { type LatLon } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { type LowVision } from "@/lib/low-vision/settings";
import { type AccessChoices, type AccessKey } from "./access";

/** What the current page is doing; set from the URL only (src/router/modes.ts). */
export type Mode = "home" | "explore" | "story" | "thenNow" | "how" | "turntable" | "official" | "team";
/** The Listen page's Inspector tabs; the Turntable's "How we know" drawer adds History (Month by month). */
export type PanelTab = "describe" | "table" | "truth" | "mapping" | "provenance" | "history";
/** Settings remembered on this device (src/components/AppState/prefs.ts). */
export type PrefKey = "lang" | "describe" | "captions" | "builtInVoice" | "hide3d" | "tuned" | "started" | "soundChoice" | AccessKey;
export type SoundChoice = "sound" | "silent";
export type Prefs = Partial<Pick<AppState, PrefKey>>;
export interface VoiceMix {
  volume: number; // 0..1
  muted: boolean;
}
export interface AppState extends AccessChoices {
  started: boolean; // past the Start overlay (with or without sound)
  soundChoice: SoundChoice | null;
  soundOn: boolean; // false after "Explore without sound", until the user turns it on
  introDone: boolean; // the opening has finished or been skipped
  playing: boolean; // live sound on (Space toggles)
  cursor: LatLon;
  track: TrackMode;
  mode: Mode;
  lang: Lang;
  describe: boolean;
  captions: boolean;
  reduceMotion: boolean;
  builtInVoice: boolean;
  allMuted: boolean;
  solo: LiveVoiceId | null;
  mix: Record<LiveVoiceId, VoiceMix>;
  panel: PanelTab;
  panelOpen: boolean; // the Listen page's Inspector (the sheet on narrow screens)
  helpOpen: boolean;
  /** The Braille Data Explorer (B) is open. */
  brailleOpen: boolean;
  stepDeg: number;
  trail: LatLon[];
  heldFrame: number | null;
  hide3d: boolean;
  tuned: boolean;
  tuning: boolean;
  log: LogEntry[];
  sonar: boolean;
  lead: Lead | null;
  lowVision: LowVision;
  osReduceMotion: boolean;
}
export interface Lead {
  text: string;
  n: number;
}
export type ToggleKey = "describe" | "captions" | "reduceMotion" | "builtInVoice" | "allMuted" | "hide3d";
export type AppAction =
  | { type: "start" }
  | { type: "startSilent" }
  | { type: "resetStart" }
  | { type: "enableSound" }
  | { type: "introDone" }
  | { type: "setPlaying"; playing: boolean }
  | { type: "moveCursor"; dLat: number; dLon: number }
  | { type: "setCursor"; cursor: LatLon; remember?: boolean; lead?: string }
  | { type: "cursorBack" }
  | { type: "setStepDeg"; stepDeg: number }
  | { type: "holdFrame"; index: number | null }
  | { type: "setTrack"; track: TrackMode }
  | { type: "setMode"; mode: Mode }
  | { type: "setLang"; lang: Lang }
  | { type: "toggle"; key: ToggleKey }
  | { type: "setReduceMotion"; on: boolean }
  | { type: "setSolo"; solo: LiveVoiceId | null }
  | { type: "setVoiceMix"; voice: LiveVoiceId; mix: Partial<VoiceMix> }
  | { type: "setPanel"; panel: PanelTab; open?: boolean }
  | { type: "setPanelOpen"; open: boolean }
  | { type: "setHelpOpen"; open: boolean }
  | { type: "setBrailleOpen"; open: boolean }
  | { type: "setAccess"; patch: Partial<AccessChoices> }
  | { type: "startTuning" }
  | { type: "note"; entry: LogEntry }
  | { type: "setSonar"; on: boolean }
  | { type: "setLowVision"; patch: Partial<LowVision> }
  | { type: "lowVisionPreset"; on: boolean }
  | { type: "resetLowVision" }
  | { type: "endTuning" };
