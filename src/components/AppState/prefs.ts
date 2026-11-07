import { LANGS } from "@/lib/i18n/types";
import type { PrefKey, Prefs, SoundChoice } from "./reducer";

// Per-device conveniences only: nothing here is needed for the app to work,
// and a blocked or empty storage just means the defaults.
export const PREFS_STORAGE_KEY = "jukebox.prefs.v1";
const FLAGS = ["describe", "captions", "builtInVoice", "started"] as const satisfies readonly PrefKey[];
const SOUND_CHOICES: readonly SoundChoice[] = ["sound", "silent"];

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
    // A choice only counts with the Start it belongs to (an old file has started without a choice: that still works).
    if (!prefs.started) delete prefs.soundChoice;
    return prefs;
  } catch {
    return {};
  }
}

export function writePrefs(prefs: Required<Prefs>): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked (private window, site data off): the settings just aren't remembered.
  }
}
