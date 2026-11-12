// The art settings (docs/statement/ART.md): Instrument style (Earth Orchestra / Plain tones) and the Science ↔ Art
// dial, remembered on this device (try/catch: blocked storage only means they aren't remembered), plus what the
// foreground plays now (the record, its play mode), which the dial's layers need. A small external store, so the
// sound engines and the settings UI read one value.

import { DIAL_STOPS, type DialStop, type InstrumentStyle, type PlayMode } from "@/lib/audio/layers/types";
import { FLAGS } from "@/lib/flags";

export const STYLES = ["orchestra", "plain"] as const satisfies readonly InstrumentStyle[];

export interface ArtPrefs {
  style: InstrumentStyle;
  dial: DialStop;
}

/** What the foreground is playing: the record the dial's layers describe. null = nothing with a dial. */
export interface PlayContext {
  recordId: string;
  playMode: PlayMode;
  /** The frame's month (1–12), for the drone's season colour; null = unknown (the dry colour). */
  month: number | null;
}

export interface ArtState extends ArtPrefs {
  context: PlayContext | null;
}

export const ART_DEFAULTS: ArtPrefs = { style: "orchestra", dial: 0.5 };
const KEY = "bloop.art.v1";

function read(): ArtPrefs {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const saved = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    return {
      style: STYLES.find((s) => s === saved.style) ?? ART_DEFAULTS.style,
      dial: DIAL_STOPS.find((d) => d === saved.dial) ?? ART_DEFAULTS.dial,
    };
  } catch {
    return ART_DEFAULTS;
  }
}

let state: ArtState | null = null;
const listeners = new Set<() => void>();
const SERVER: ArtState = { ...ART_DEFAULTS, context: null };

/** The current settings (defaults on the server and before storage is read). */
export function getArt(): ArtState {
  if (state === null) state = typeof window === "undefined" ? SERVER : { ...read(), context: null };
  return state;
}

export const getServerArt = (): ArtState => SERVER;

export function subscribeArt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setArt(patch: Partial<ArtState>): void {
  const next = { ...getArt(), ...patch };
  state = next;
  if (patch.style !== undefined || patch.dial !== undefined) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ style: next.style, dial: next.dial }));
    } catch {
      // Not remembered; still used for this visit.
    }
  }
  for (const l of listeners) l();
}

/** The dial's stop, or null when the dial isn't built into this version (flag off: no art layers at all). */
export function dialStop(s: ArtPrefs = getArt()): DialStop | null {
  return FLAGS.artDial ? s.dial : null;
}

/** Whether data voices wear Earth Orchestra now: the style is chosen, and the dial (if any) is past Measure. */
export function orchestraOn(s: ArtPrefs = getArt()): boolean {
  if (!FLAGS.artOrchestra || s.style !== "orchestra") return false;
  const dial = dialStop(s);
  return dial === null || dial > 0;
}
