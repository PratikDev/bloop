// Ask Bloop's voice input (spec §5.5): push-to-talk through the browser's own speech recognition (Web Speech API; no
// new dependency, no audio kept). One utterance per press; it ends on release, on a result, on an error or after
// LISTEN_MS. The caller ducks the sonification while listening and always releases it (src/lib/audio duck).
import type { Lang } from "@/lib/i18n/types";

/** The parts of the Web Speech API this uses (the DOM library has no types for it). */
interface RecognitionResult {
  readonly 0: { readonly transcript: string };
}
interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; readonly [i: number]: RecognitionResult };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  /** Chrome's on-device recognition (where offered). */
  processLocally?: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type Availability = "available" | "downloadable" | "downloading" | "unavailable";
type RecognitionCtor = (new () => Recognition) & { available?: (o: { langs: string[]; processLocally: boolean }) => Promise<Availability> };

/** Where speech is recognised: on this device, by the browser's speech service, or not at all. */
export type RecognitionMode = "on-device" | "cloud" | "unavailable";

/** Each input language's recogniser locale (Bangladesh's Bangla; English as the browsers know it best). */
export const RECOGNITION_LANG: Record<Lang, string> = { en: "en-US", bn: "bn-BD" };
/** Longest one press listens (design choice: a command is a few seconds). */
export const LISTEN_MS = 8000;

export type Heard = { kind: "heard"; text: string } | { kind: "error"; error: "unavailable" | "no-speech" | "not-allowed" | "aborted" | "network" | "timeout" | "other" };

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Whether this browser can listen at all (Chromium-based browsers and Safari do; Firefox doesn't). */
export const speechRecognitionAvailable = () => ctor() !== null;

const ERRORS: Record<string, Extract<Heard, { kind: "error" }>["error"]> = {
  "no-speech": "no-speech",
  "not-allowed": "not-allowed",
  "service-not-allowed": "not-allowed",
  aborted: "aborted",
  network: "network",
};

/** Whether this browser can recognise `lang` on the device (then nothing leaves it), or only through its service. */
export async function recognitionMode(lang: Lang): Promise<RecognitionMode> {
  const Ctor = ctor();
  if (!Ctor) return "unavailable";
  try {
    const local = await Ctor.available?.({ langs: [RECOGNITION_LANG[lang]], processLocally: true });
    return local === "available" ? "on-device" : "cloud";
  } catch {
    return "cloud";
  }
}

export interface Listening {
  /** Resolves once: what was heard, or why nothing was. */
  done: Promise<Heard>;
  /** Push-to-talk released: finish with what was heard so far. */
  stop(): void;
  /** Cancel (Escape, or the user starts typing): nothing is used. */
  cancel(): void;
}

/**
 * Starts listening for one utterance in `lang`; `onInterim` gets the words as they come (for the visible line).
 * `onDevice` (from recognitionMode) keeps the audio on the device where the browser can.
 */
export function listen(lang: Lang, onInterim?: (text: string) => void, onDevice = false): Listening {
  const Ctor = ctor();
  if (!Ctor) return { done: Promise.resolve({ kind: "error", error: "unavailable" }), stop: () => undefined, cancel: () => undefined };
  const rec = new Ctor();
  rec.lang = RECOGNITION_LANG[lang];
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  if (onDevice) rec.processLocally = true;
  let text = "";
  let cancelled = false;
  let settle: (h: Heard) => void = () => undefined;
  const done = new Promise<Heard>((resolve) => {
    let settled = false;
    settle = (h) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(h);
    };
  });
  const timer = setTimeout(() => {
    rec.abort();
    settle(text ? { kind: "heard", text } : { kind: "error", error: "timeout" });
  }, LISTEN_MS);
  rec.onresult = (e) => {
    let words = "";
    for (let i = 0; i < e.results.length; i++) words += e.results[i][0].transcript;
    text = words.trim();
    onInterim?.(text);
  };
  rec.onerror = (e) => settle({ kind: "error", error: cancelled ? "aborted" : (ERRORS[e.error] ?? "other") });
  rec.onend = () => settle(cancelled ? { kind: "error", error: "aborted" } : text ? { kind: "heard", text } : { kind: "error", error: "no-speech" });
  try {
    rec.start();
  } catch {
    settle({ kind: "error", error: "other" });
  }
  return {
    done,
    stop: () => rec.stop(),
    cancel: () => {
      cancelled = true;
      rec.abort();
      settle({ kind: "error", error: "aborted" });
    },
  };
}
