// Ask Bloop's slot validation (spec §5.1, §6.5): anything that did not come from the parser (the §5.4 LLM route's
// output, the benchmark file) is checked against the registry's own value lists before it can run. Unknown intents,
// unknown values and extra slots are refused (null). Place slots are words, never coordinates: any digit is refused.
import { SPEECH_MODES, VERBOSITIES } from "@/components/AppState/access";
import { LANGS } from "@/lib/i18n/types";
import { ASK_PAGES, ASK_RECORDS, EXTREMES, FRAME_STEPS, type Intent, type IntentName } from "./intents";
import { INTENT_NAMES } from "./registry";
// >>> DATA
import { DATA_SLOTS } from "./data-intents";
// <<< DATA

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/u;
const MAX_PLACE = 80;
/** A place as said: letters, spaces and a little punctuation, never a number (coordinates come from the gazetteer). */
const isPlace = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= MAX_PLACE && !/[0-9০-৯]/u.test(v);
const placeOrNull = (v: unknown): v is string | null => v === null || isPlace(v);

/** The slots each intent takes (anything else is refused). */
export const SLOTS: Record<IntentName, readonly string[]> = {
  play: [],
  pause: [],
  stop: [],
  select_record: ["record"],
  next_record: [],
  previous_record: [],
  go_to_place: ["place"],
  set_time: ["step"],
  open_page: ["page"],
  set_setting: ["setting", "value"],
  help: [],
  repeat: [],
  more: [],
  cancel: [],
  value_here: [],
  value_at: ["place"],
  extreme_in: ["kind", "place"],
  compare_dates: ["place", "dateA", "dateB"],
  what_am_i_hearing: [],
  about_record: ["record"],
  how_reliable: [],
  // >>> DATA
  ...DATA_SLOTS,
  // <<< DATA
};

function setting(s: Raw): Intent | null {
  if (s.setting === "verbosity" && oneOf(VERBOSITIES, s.value)) return { name: "set_setting", setting: "verbosity", value: s.value };
  if (s.setting === "speech_output" && oneOf(SPEECH_MODES, s.value)) return { name: "set_setting", setting: "speech_output", value: s.value };
  if (s.setting === "input_language" && oneOf(LANGS, s.value)) return { name: "set_setting", setting: "input_language", value: s.value };
  return null;
}

/** `{ name, ...slots }` checked against the registry; null when anything is unknown, missing or extra. */
export function validateIntent(raw: unknown): Intent | null {
  if (!isObject(raw) || !oneOf(INTENT_NAMES, raw.name)) return null;
  const name = raw.name;
  const allowed = new Set(["name", ...SLOTS[name]]);
  if (Object.keys(raw).some((k) => !allowed.has(k))) return null;
  switch (name) {
    case "select_record":
      return oneOf(ASK_RECORDS, raw.record) ? { name, record: raw.record } : null;
    case "go_to_place":
    case "value_at":
      return isPlace(raw.place) ? { name, place: raw.place.trim() } : null;
    case "set_time":
      return oneOf(FRAME_STEPS, raw.step) ? { name, step: raw.step } : null;
    case "open_page":
      return oneOf(ASK_PAGES, raw.page) ? { name, page: raw.page } : null;
    case "set_setting":
      return setting(raw);
    case "extreme_in":
      return oneOf(EXTREMES, raw.kind) && placeOrNull(raw.place ?? null) ? { name, kind: raw.kind, place: (raw.place as string | null | undefined) ?? null } : null;
    case "compare_dates":
      return typeof raw.dateA === "string" && MONTH.test(raw.dateA) && typeof raw.dateB === "string" && MONTH.test(raw.dateB) && placeOrNull(raw.place ?? null)
        ? { name, place: (raw.place as string | null | undefined) ?? null, dateA: raw.dateA, dateB: raw.dateB }
        : null;
    case "about_record":
      return raw.record === undefined || raw.record === null ? { name, record: null } : oneOf(ASK_RECORDS, raw.record) ? { name, record: raw.record } : null;
    default:
      return { name };
  }
}
