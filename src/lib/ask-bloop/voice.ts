import type { Lang } from "@/lib/i18n/types";

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

export type RecognitionMode = "on-device" | "cloud" | "unavailable";

const RECOGNITION_LANG: Record<Lang, string> = { en: "en-US", bn: "bn-BD" };
const LISTEN_MS = 8000;

export type Heard = { kind: "heard"; text: string } | { kind: "error"; error: "unavailable" | "no-speech" | "not-allowed" | "aborted" | "network" | "timeout" | "other" };

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechRecognitionAvailable = () => ctor() !== null;

const ERRORS: Record<string, Extract<Heard, { kind: "error" }>["error"]> = {
  "no-speech": "no-speech",
  "not-allowed": "not-allowed",
  "service-not-allowed": "not-allowed",
  aborted: "aborted",
  network: "network",
};

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
  done: Promise<Heard>;
  stop(): void;
  cancel(): void;
}

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
