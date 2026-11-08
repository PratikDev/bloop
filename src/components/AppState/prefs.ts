import { LANGS } from "@/lib/i18n/types";
import { ACCESS_VALUES, type AccessChoices, type AccessKey } from "./access";
import type { AppState, PrefKey, Prefs, SoundChoice } from "./reducer";

// Per-device conveniences only: nothing here is needed for the app to work,
// and a blocked or empty storage just means the defaults.
export const PREFS_STORAGE_KEY = "jukebox.prefs.v1";
const FLAGS = ["describe", "captions", "builtInVoice", "started"] as const satisfies readonly PrefKey[];
const SOUND_CHOICES: readonly SoundChoice[] = ["sound", "silent"];
/** Every setting remembered on this device. */
export const PREF_KEYS = ["lang", "describe", "captions", "builtInVoice", "started", "soundChoice", "speechMode", "verbosity", "channels"] as const satisfies readonly PrefKey[];

/** The remembered settings out of the app state. */
export function pickPrefs(state: Pick<AppState, PrefKey>): Required<Prefs> {
  return Object.fromEntries(PREF_KEYS.map((k) => [k, state[k]])) as Required<Prefs>;
}

export function readPrefs(): Prefs {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? "{}");
    if (typeof raw !== "object" || raw === null) return {};
    const saved = raw as Record<string, unknown>;
    const prefs: Prefs = {};
    const lang = LANGS.find((l) => l === saved.lang);
    if (lang) prefs.lang = lang;
    for (const flag of FLAGS) if (typeof saved[flag] === "boolean") prefs[flag] = saved[flag];
    const choice = SOUND_CHOICES.find((c) => c === saved.soundChoice);
    if (choice) prefs.soundChoice = choice;
    for (const key of Object.keys(ACCESS_VALUES) as AccessKey[]) readChoice(prefs, key, saved[key]);
    // A choice only counts with the Start it belongs to (an old file has started without a choice: that still works).
    if (!prefs.started) delete prefs.soundChoice;
    return prefs;
  } catch {
    return {};
  }
}

/** One accessibility choice, kept only when it is one of its allowed values. */
function readChoice<K extends AccessKey>(prefs: Prefs, key: K, saved: unknown) {
  const value = (ACCESS_VALUES[key] as readonly AccessChoices[K][]).find((v) => v === saved);
  if (value !== undefined) prefs[key] = value;
}

export function writePrefs(prefs: Required<Prefs>): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked (private window, site data off): the settings just aren't remembered.
  }
}
