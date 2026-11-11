import { TRACK_VOICES, type LiveVoiceId, type TrackMode } from "@/lib/audio-adapter/types";
import { DEFAULT_CELL, remember } from "@/a11y/mapNav";
import { addEntry, type LogEntry } from "@/lib/expedition-log";
import { FLAGS } from "@/lib/flags";
import { clampLat, START_CURSOR, wrapLon, type LatLon } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { applyPreset, LV_DEFAULTS, type LowVision } from "@/lib/low-vision/settings";
import { ACCESS_DEFAULTS, type AccessChoices, type AccessKey } from "./access";

/** What the current page is doing; set from the URL only (src/router/modes.ts). */
export type Mode = "home" | "explore" | "story" | "thenNow" | "how" | "turntable" | "official" | "team";
/** The Listen page's Inspector tabs; the Turntable's "How we know" drawer adds History (Month by month). */
export type PanelTab = "describe" | "table" | "truth" | "mapping" | "provenance" | "history";

/** Settings remembered on this device (src/components/AppState/prefs.ts). */
export type PrefKey = "lang" | "describe" | "captions" | "builtInVoice" | "hide3d" | "tuned" | "started" | "soundChoice" | AccessKey;

/** What the visitor chose at Start: remembered, so a return visit knows; null before any choice. */
export type SoundChoice = "sound" | "silent";
export type Prefs = Partial<Pick<AppState, PrefKey>>;

interface VoiceMix {
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
  /** Degrees an arrow key moves the needle (+ and − on the map; src/a11y/mapNav.ts). */
  stepDeg: number;
  /** Earlier places of the needle, oldest first ("." goes back; arrow steps, jumps and Go to add to it). */
  trail: LatLon[];
  /** The storm time-lapse frame PageUp/PageDown hold on the map (index into its frames); null = the live frame. */
  heldFrame: number | null;
  /** The 3D views are hidden (Settings); every task still works from the HTML around them. */
  hide3d: boolean;
  /** Track 0 "Tuning" was finished or skipped on this device (remembered), and whether it is showing now. */
  tuned: boolean;
  tuning: boolean;
  /** The expedition log: this session's places, values, comparisons and their sources (never saved by the app). */
  log: LogEntry[];
  /** The sonar (N) is pinging toward its target. */
  sonar: boolean;
  /** What the map's next settled announcement leads with (a jump's region or place); `n` counts, so a repeat is new. */
  lead: Lead | null;
  /** Low-vision mode's settings (saved on their own, src/lib/low-vision/settings.ts). */
  lowVision: LowVision;
  /** The OS's reduced-motion setting; calm view reduces motion too, and gives it back when it is turned off. */
  osReduceMotion: boolean;
}

interface Lead {
  text: string;
  n: number;
}

/** The on/off settings (Settings, Help and the keys toggle them). */
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

const FULL_MIX: VoiceMix = { volume: 1, muted: false };

export const initialState: AppState = {
  started: false,
  soundChoice: null,
  soundOn: false,
  introDone: false,
  playing: false,
  cursor: START_CURSOR,
  track: "both",
  mode: "explore",
  lang: "en",
  describe: false,
  captions: true,
  reduceMotion: false,
  builtInVoice: true,
  allMuted: false,
  solo: null,
  mix: { ocean: FULL_MIX, rain: FULL_MIX, snow: FULL_MIX },
  panel: "provenance",
  panelOpen: false,
  helpOpen: false,
  brailleOpen: false,
  stepDeg: DEFAULT_CELL,
  trail: [],
  heldFrame: null,
  hide3d: false,
  lead: null,
  tuned: false,
  tuning: false,
  log: [],
  sonar: false,
  lowVision: LV_DEFAULTS,
  osReduceMotion: false,
  ...ACCESS_DEFAULTS,
};

/** New low-vision settings; calm view also reduces motion, and turning it off gives back the OS setting. */
function withLowVision(state: AppState, lowVision: LowVision): AppState {
  const calmChanged = lowVision.calm !== state.lowVision.calm;
  return { ...state, lowVision, reduceMotion: calmChanged ? lowVision.calm || state.osReduceMotion : state.reduceMotion };
}

/** Pages where the live sound of the cursor plays: the map, How we know beside it (Hear the legend over it, as before),
 *  and the Turntable's needle (on its own engine: src/lib/audio-engines.ts). */
export function isLiveMode(mode: Mode): boolean {
  return mode === "explore" || mode === "how" || mode === "turntable";
}

/** Whether live sound may play at all: past Start, sound on and playing, intro over. */
export function liveSoundOn(state: AppState): boolean {
  return state.started && state.soundOn && state.playing && state.introDone;
}

/** Whether a live voice is sounding right now (for rings and captions). */
export function isVoiceAudible(state: AppState, voice: LiveVoiceId): boolean {
  if (!liveSoundOn(state) || state.allMuted || !isLiveMode(state.mode)) return false;
  if (state.mix[voice].muted || state.mix[voice].volume === 0) return false;
  if (state.solo !== null && state.solo !== voice) return false;
  return TRACK_VOICES[state.track].includes(voice);
}

/** Track 0 opens once the intro is over, before the first exploration, until it has been finished or skipped. */
const withTuning = (state: AppState, on: boolean = FLAGS.tuning): AppState => (on && !state.tuned ? { ...state, tuning: true } : state);

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "start":
      return { ...state, started: true, soundChoice: "sound", soundOn: true, playing: true };
    case "startSilent":
      // Straight to the map: no opening (it is a sound piece), captions carry the values.
      return withTuning({ ...state, started: true, soundChoice: "silent", soundOn: false, playing: false, introDone: true, captions: true });
    case "resetStart":
      // Forget the sound choice: back to the first visit (the Start buttons, then the opening).
      return { ...state, started: false, soundChoice: null, soundOn: false, playing: false, introDone: false };
    case "enableSound":
      return { ...state, soundOn: true, playing: true };
    case "introDone":
      return state.introDone ? state : withTuning({ ...state, introDone: true });
    case "setPlaying":
      return { ...state, playing: action.playing };
    case "moveCursor":
      return {
        ...state,
        trail: remember(state.trail, state.cursor),
        cursor: {
          lat: clampLat(state.cursor.lat + action.dLat),
          lon: wrapLon(state.cursor.lon + action.dLon),
        },
      };
    case "setCursor":
      return {
        ...state,
        trail: action.remember ? remember(state.trail, state.cursor) : state.trail,
        cursor: { lat: clampLat(action.cursor.lat), lon: wrapLon(action.cursor.lon) },
        lead: action.lead === undefined ? state.lead : { text: action.lead, n: (state.lead?.n ?? 0) + 1 },
      };
    case "cursorBack": {
      const back = state.trail[state.trail.length - 1];
      return back ? { ...state, cursor: back, trail: state.trail.slice(0, -1) } : state;
    }
    case "setStepDeg":
      return { ...state, stepDeg: action.stepDeg };
    case "holdFrame":
      return { ...state, heldFrame: action.index };
    case "setTrack":
      return { ...state, track: action.track };
    case "setMode":
      // A held time-lapse frame belongs to the map it was held on.
      return { ...state, mode: action.mode, heldFrame: action.mode === state.mode ? state.heldFrame : null };
    case "setLang":
      return { ...state, lang: action.lang };
    case "toggle":
      return { ...state, [action.key]: !state[action.key] };
    case "setReduceMotion":
      return { ...state, osReduceMotion: action.on, reduceMotion: action.on || state.lowVision.calm };
    case "setLowVision":
      return withLowVision(state, { ...state.lowVision, ...action.patch });
    case "lowVisionPreset":
      return withLowVision(state, applyPreset(state.lowVision, action.on));
    case "resetLowVision":
      return withLowVision(state, LV_DEFAULTS);
    case "setSolo":
      return { ...state, solo: action.solo };
    case "setVoiceMix":
      return { ...state, mix: { ...state.mix, [action.voice]: { ...state.mix[action.voice], ...action.mix } } };
    case "setPanel":
      return { ...state, panel: action.panel, panelOpen: action.open ?? state.panelOpen };
    case "setPanelOpen":
      return { ...state, panelOpen: action.open };
    case "setHelpOpen":
      return { ...state, helpOpen: action.open };
    case "setBrailleOpen":
      return { ...state, brailleOpen: action.open };
    case "setAccess":
      return { ...state, ...action.patch };
    case "startTuning":
      return { ...state, tuning: true };
    case "note":
      return { ...state, log: addEntry(state.log, action.entry) };
    case "setSonar":
      return { ...state, sonar: action.on };
    case "endTuning":
      return { ...state, tuning: false, tuned: true };
  }
}
