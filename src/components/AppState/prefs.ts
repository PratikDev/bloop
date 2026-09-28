import { LANGS } from "@/lib/i18n";
import type { PrefKey, Prefs } from "./reducer";

// Per-device conveniences only: nothing here is needed for the app to work,
// and a blocked or empty storage just means the defaults.
const STORAGE_KEY = "jukebox.prefs.v1";
const FLAGS = ["describe", "captions", "builtInVoice"] as const satisfies readonly PrefKey[];

export function readPrefs(): Prefs {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (typeof raw !== "object" || raw === null) return {};
    const saved = raw as Record<string, unknown>;
    const prefs: Prefs = {};
    const lang = LANGS.find((l) => l === saved.lang);
    if (lang) prefs.lang = lang;
    for (const flag of FLAGS) if (typeof saved[flag] === "boolean") prefs[flag] = saved[flag];
    return prefs;
  } catch {
    return {};
  }
}

export function writePrefs(prefs: Required<Prefs>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked (private window, site data off): the settings just aren't remembered.
  }
}
