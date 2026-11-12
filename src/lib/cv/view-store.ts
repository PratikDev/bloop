// The CV view's own settings, shared by the "What the jukebox read" panel, the chord toggle (panel and Settings) and
// the chord layer: which box is read, and whether the listener turned the chord on (off for first-time visitors). Kept
// apart from the app's reducer; remembered on this device in a try/catch (blocked storage: just not remembered).
import { BOX_IDS, NEEDLE_BOX } from "./boxes";

export interface CvView {
  box: string;
  chord: boolean;
}

const KEY = "bloop.cv.view.v1";
const DEFAULTS: CvView = { box: NEEDLE_BOX, chord: false };

function read(): CvView {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (typeof raw !== "object" || raw === null) return DEFAULTS;
    const saved = raw as Record<string, unknown>;
    return {
      box: BOX_IDS.find((b) => b === saved.box) ?? DEFAULTS.box,
      chord: typeof saved.chord === "boolean" ? saved.chord : DEFAULTS.chord,
    };
  } catch {
    return DEFAULTS;
  }
}

let state: CvView | null = null;
const listeners = new Set<() => void>();

export const getCvView = (): CvView => (state ??= typeof window === "undefined" ? DEFAULTS : read());
export const serverCvView = (): CvView => DEFAULTS;

export function setCvView(patch: Partial<CvView>) {
  state = { ...getCvView(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Not remembered, still used.
  }
  for (const l of listeners) l();
}

export function subscribeCvView(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
