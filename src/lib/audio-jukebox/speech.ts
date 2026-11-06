// Browser speech with ducking (AUDIO_RESEARCH A6): the sonification bus dips to
// duck.level when speech starts and comes back on end AND on error, so it can
// never stay ducked. A new utterance cancels the current one.

import { MAPPING } from "@/lib/audio/mapping";
import { emit, emitCaption } from "./events";
import { getGraph, glideTo } from "./graph";
import type { Lang } from "./types";

const LANG_TAGS: Record<Lang, readonly string[]> = {
  en: ["en-US", "en-GB", "en"],
  bn: ["bn-BD", "bn-IN", "bn"],
};

let voices: SpeechSynthesisVoice[] = [];
let ducked = false;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (voices.length === 0) loadVoices();
  const matches = (v: SpeechSynthesisVoice) =>
    LANG_TAGS[lang].some((tag) => v.lang.toLowerCase().startsWith(tag.toLowerCase()));
  const candidates = voices.filter(matches);
  return candidates.find((v) => v.localService) ?? candidates[0] ?? null;
}

function setDucked(on: boolean) {
  const graph = getGraph();
  ducked = on;
  if (graph) {
    const { duck } = MAPPING.global;
    glideTo(graph.ctx, graph.sonification.gain, on ? duck.level : 1, on ? duck.attackSec : duck.releaseSec);
  }
  emit({ kind: "state", ready: graph?.ctx.state === "running", playing: true, ducked });
}

export function initSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

export function speak(text: string, lang: Lang): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    emitCaption("caption.noSpeech");
    return Promise.resolve();
  }
  const voice = pickVoice(lang);
  if (lang === "bn" && !voice) {
    // Never read Bangla with an English voice.
    emitCaption("caption.noBanglaVoice");
    return Promise.resolve();
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? LANG_TAGS[lang][0];
    if (voice) u.voice = voice;
    const finish = () => {
      setDucked(false);
      resolve();
    };
    u.onstart = () => setDucked(true);
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}

export function cancelSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  if (ducked) setDucked(false);
}
