// Ask Bloop (remaining features/CLAUDE_CODE_PROMPT_voice_ask_bloop.md §5.1): the intents, as one typed union. Only
// intents whose handler already exists in Bloop are here; the ones skipped (set_mode Listen/Analyse, set_dial,
// slower/faster, set_time to a date) are listed in docs/voice/RECON.md.
import type { SpeechMode, Verbosity } from "@/components/AppState/access";
import type { TrackMode } from "@/lib/audio/types";
import type { Lang } from "@/lib/i18n/types";

/** Pages Ask Bloop can open: the header's pages and the tour (each is an existing mode). */
export const ASK_PAGES = ["listen", "tour", "thenNow", "how", "official", "turntable", "team", "home"] as const;
export type AskPage = (typeof ASK_PAGES)[number];

/** The live records, as the track choice names them. */
export const ASK_RECORDS = ["ocean", "rain", "both"] as const satisfies readonly TrackMode[];

/** Frame steps the Listen page already has (PageUp / PageDown hold a newer or older rain frame). */
export const FRAME_STEPS = ["next_frame", "previous_frame"] as const;
export type FrameStep = (typeof FRAME_STEPS)[number];

export const EXTREMES = ["highest", "lowest"] as const;
export type Extreme = (typeof EXTREMES)[number];

/** A setting Ask Bloop can change, with its value (the app's own value lists). */
export type SettingChange = { setting: "verbosity"; value: Verbosity } | { setting: "speech_output"; value: SpeechMode } | { setting: "input_language"; value: Lang };

/** Every intent with its slots. Places are the words the user said; resolvePlace() maps them to the gazetteer. */
export type Intent =
  | { name: "play" }
  | { name: "pause" }
  | { name: "stop" }
  | { name: "select_record"; record: TrackMode }
  | { name: "next_record" }
  | { name: "previous_record" }
  | { name: "go_to_place"; place: string }
  | { name: "set_time"; step: FrameStep }
  | { name: "open_page"; page: AskPage }
  | ({ name: "set_setting" } & SettingChange)
  | { name: "help" }
  | { name: "repeat" }
  | { name: "more" }
  | { name: "cancel" }
  | { name: "value_here" }
  | { name: "value_at"; place: string }
  | { name: "extreme_in"; kind: Extreme; place: string | null }
  | { name: "compare_dates"; place: string | null; dateA: string; dateB: string }
  | { name: "what_am_i_hearing" }
  | { name: "about_record"; record: TrackMode | null }
  | { name: "how_reliable" };

export type IntentName = Intent["name"];
export type IntentOf<N extends IntentName> = Extract<Intent, { name: N }>;

/** Actions operate Bloop; questions are answered from its data only. */
export type IntentKind = "action" | "question";
