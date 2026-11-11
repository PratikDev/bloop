import type { SpeechMode, Verbosity } from "@/components/AppState/access";
import type { TrackMode } from "@/lib/audio/types";
import type { Lang } from "@/lib/i18n/types";
import type { DataIntent } from "./data-intents";

export const ASK_PAGES = ["listen", "tour", "thenNow", "how", "official", "turntable", "team", "home"] as const;
export type AskPage = (typeof ASK_PAGES)[number];

export const ASK_RECORDS = ["ocean", "rain", "both"] as const satisfies readonly TrackMode[];

export const FRAME_STEPS = ["next_frame", "previous_frame"] as const;
type FrameStep = (typeof FRAME_STEPS)[number];

export const EXTREMES = ["highest", "lowest"] as const;
export type Extreme = (typeof EXTREMES)[number];

export type SettingChange = { setting: "verbosity"; value: Verbosity } | { setting: "speech_output"; value: SpeechMode } | { setting: "input_language"; value: Lang };

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
  | { name: "how_reliable" }
  | DataIntent;

export type IntentName = Intent["name"];
export type IntentOf<N extends IntentName> = Extract<Intent, { name: N }>;

export type IntentKind = "action" | "question";
