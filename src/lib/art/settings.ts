import { DIAL_STOPS, type DialStop, type InstrumentStyle, type PlayMode } from "@/lib/audio/layers/types";
import { FLAGS } from "@/lib/flags";

export const STYLES = ["orchestra", "plain"] as const satisfies readonly InstrumentStyle[];

interface ArtPrefs {
  style: InstrumentStyle;
  dial: DialStop;
}

export interface PlayContext {
  recordId: string;
  playMode: PlayMode;
  month: number | null;
}

export interface ArtState extends ArtPrefs {
  context: PlayContext | null;
}

const ART_DEFAULTS: ArtPrefs = { style: "orchestra", dial: 0.5 };
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
    }
  }
  for (const l of listeners) l();
}

export function dialStop(s: ArtPrefs = getArt()): DialStop | null {
  return FLAGS.artDial ? s.dial : null;
}

export function orchestraOn(s: ArtPrefs = getArt()): boolean {
  if (!FLAGS.artOrchestra || s.style !== "orchestra") return false;
  const dial = dialStop(s);
  return dial === null || dial > 0;
}
