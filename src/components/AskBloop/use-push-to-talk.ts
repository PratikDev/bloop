"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isTypingTarget } from "@/a11y/keys";
import { beginDuck } from "@/lib/audio";
import { audio } from "@/lib/audio-adapter";
import { listen, recognitionMode, type Listening, type RecognitionMode } from "@/lib/ask-bloop/voice";
import type { Lang } from "@/lib/i18n";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";

/**
 * Push-to-talk: hold the Speak button, or Alt+K anywhere but a text field (it can be turned off), and
 * release to finish. While listening: Bloop's voice stops, the sonification is ducked (always released, whatever
 * ends it), a short earcon marks the start and the end, and the status region says so. What was heard goes to
 * `onHeard` (the typed box, so it can be corrected before Enter).
 */
export function usePushToTalk(lang: Lang, enabled: boolean, shortcut: boolean, onHeard: (text: string) => void, onInterim: (text: string) => void) {
  const { state } = useAppState();
  const t = useT();
  const announce = useAnnounce();
  const [listening, setListening] = useState(false);
  const [mode, setMode] = useState<RecognitionMode>("unavailable");
  const session = useRef<{ listening: Listening; release: () => void } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void recognitionMode(lang).then((m) => live && setMode(m));
    return () => {
      live = false;
    };
  }, [enabled, lang]);

  const start = useCallback(async () => {
    if (!enabled || session.current || mode === "unavailable") return;
    window.speechSynthesis?.cancel();
    if (state.soundOn) audio.playEarcon("ping");
    const release = beginDuck();
    const l = listen(lang, onInterim, mode === "on-device");
    session.current = { listening: l, release };
    setListening(true);
    announce(t("ask.listening"));
    const heard = await l.done;
    release();
    session.current = null;
    setListening(false);
    if (state.soundOn) audio.playEarcon("ping");
    if (heard.kind === "heard") onHeard(heard.text);
    else if (heard.error !== "aborted") announce(t(heard.error === "unavailable" ? "ask.voiceUnavailable" : "ask.voiceError"));
  }, [enabled, mode, lang, onInterim, onHeard, announce, t, state.soundOn]);

  const stop = useCallback(() => session.current?.listening.stop(), []);
  const cancel = useCallback(() => session.current?.listening.cancel(), []);

  // Never left ducked or listening: leaving the page ends it.
  useEffect(() => () => session.current?.listening.cancel(), []);

  // Alt+K: hold to talk, release to finish (never in a text field; off when the reader turns it off).
  useEffect(() => {
    if (!enabled || !shortcut) return;
    const down = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.code !== "KeyK" || e.repeat || isTypingTarget(e.target)) return;
      e.preventDefault();
      void start();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyK" || e.key === "Alt") stop();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled, shortcut, start, stop]);

  return { listening, mode, start, stop, cancel };
}
