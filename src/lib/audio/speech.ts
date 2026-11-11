// Spoken values (AUDIO_RESEARCH A6, C4) through the browser's speech engine,
// ducking the sonification while it talks. Prefers a local (offline) voice.
// No Bangla voice → stay silent and say so in a caption; never read Bangla
// with an English voice.

import { emitCaption } from "./captions";
import { beginDuck } from "./duck";
import type { Lang } from "./types";
import { pickVoice } from "./voice-pick";

const VOICE_WAIT_MS = 1500; // voices load asynchronously on first use
const START_TIMEOUT_MS = 5000; // some browsers never fire start or end when they can't speak
// Errors that mean "a newer speak() or stopAll() took over", not "this device can't speak".
const INTERRUPTIONS = new Set(["interrupted", "canceled"]);

const hasSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** The device's speech voices, waiting briefly for them to load the first time. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!hasSpeech()) return Promise.resolve([]);
  const now = speechSynthesis.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      speechSynthesis.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(speechSynthesis.getVoices());
    };
    const timer = setTimeout(done, VOICE_WAIT_MS);
    speechSynthesis.addEventListener("voiceschanged", done);
  });
}

let current: SpeechSynthesisUtterance | null = null;

/** Speaks `text`, ducking the sonification until it ends. A new call interrupts the previous one. */
export async function speak(text: string, lang: Lang): Promise<void> {
  if (!hasSpeech()) {
    emitCaption("caption.noSpeech");
    return;
  }
  const voices = await loadVoices();
  if (voices.length === 0) {
    emitCaption("caption.noSpeech"); // speech API present, but no voices installed
    return;
  }
  const voice = pickVoice(voices, lang);
  if (!voice && lang === "bn") {
    emitCaption("caption.noBanglaVoice");
    return;
  }
  speechSynthesis.cancel(); // rapid Enter presses: newest wins

  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? "en-US";
  if (voice) u.voice = voice;
  current = u; // keep a reference so the browser doesn't drop the end event

  await new Promise<void>((resolve) => {
    let release: (() => void) | null = null;
    let settled = false;
    const finish = (failed: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      release?.();
      if (current === u) current = null;
      if (failed) emitCaption("caption.noSpeech");
      resolve();
    };
    const watchdog = setTimeout(() => {
      if (current === u) speechSynthesis.cancel();
      finish(true);
    }, START_TIMEOUT_MS);
    u.onstart = () => {
      clearTimeout(watchdog);
      release = beginDuck();
    };
    u.onend = () => finish(false);
    u.onerror = (e) => finish(!INTERRUPTIONS.has(e.error));
    speechSynthesis.speak(u);
  });
}
