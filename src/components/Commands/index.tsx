"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { locationForMode } from "@/router/modes";
import { sleep } from "@/lib/abortable";
import { audio } from "@/lib/audio-adapter";
import { bandMeans, SWEEP_CENTER, sweepPath } from "@/lib/data";
import { bindT, speechLang } from "@/lib/i18n";
import { spokenReading, readAt } from "@/lib/reading";
import { postCaption } from "@/lib/ui-captions";
import { whisperSource, type WhisperSource } from "@/lib/whisper";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { CommandsContext, SETTING_LABELS, type Line, type Commands, type SweepVisual } from "./use-commands";
import { useSoundSync } from "./use-sound-sync";

// Shortest time a said line stays before the next one (about fast reading speed).
const MIN_MS_PER_CHAR = 40;

export function CommandsProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState();
  const { fields, sst } = useLiveData();
  const announce = useAnnounce();
  const sweepRef = useRef<SweepVisual | null>(null);
  // Counts say() calls and stops, so a whisper never follows a cancelled value.
  const sayCount = useRef(0);
  const navigate = useNavigate();
  useSoundSync(state, fields);

  const commands = useMemo<Commands>(() => {
    const t = bindT(state.lang);
    const trackName = (track: typeof state.track) =>
      t(track === "ocean" ? "track.oceanLong" : track === "rain" ? "track.rainLong" : "track.both");

    const enableSound = async () => {
      await audio.ensureAudio(); // inside the click/keydown gesture
      dispatch({ type: "enableSound" });
      announce(t("sound.resumed"));
    };
    const soundOffHint = () => announce(t("sound.offHint"));

    // "~" is read aloud as "about".
    const sayable = (text: string, tl: typeof t) => text.replaceAll("~", tl("speak.approx"));

    const say = async (line: Line, source?: WhisperSource | null) => {
      const id = ++sayCount.current;
      const voiced = state.builtInVoice && state.soundOn;
      const shown = line(t, state.lang);
      // Two voices never talk at once: built-in speech OR the live region.
      // With sound off, nothing is spoken aloud.
      if (!voiced) announce(sayable(source ? t("whisper.announce", { text: shown, source: source.caption }) : shown, t));
      else postCaption("caption.speech", { text: shown });
      // Speech may be in another language than the screen (plan §17).
      const sl = speechLang(state.lang);
      const ts = bindT(sl);
      // Wait at least a short reading time: speech that can't start (no voice
      // for this language) resolves at once.
      await Promise.all([voiced ? audio.speak(sayable(line(ts, sl), ts), sl) : null, sleep(shown.length * MIN_MS_PER_CHAR)]);
      if (source && state.soundOn && id === sayCount.current) audio.playEarcon("whisper", { params: { source: source.caption } });
    };

    const startSweep = () => {
      if (!fields) return null;
      const path = sweepPath(fields, SWEEP_CENTER);
      sweepRef.current = { ...path, center: SWEEP_CENTER };
      return audio.playSweep(path.points);
    };

    return {
      async start() {
        await audio.ensureAudio(); // inside the click/keydown gesture
        dispatch({ type: "start" }); // the Opening plays next, then sets introDone
      },
      startSilent() {
        dispatch({ type: "startSilent" }); // no AudioContext is created
      },
      enableSound,
      moveCursor(dLat, dLon) {
        dispatch({ type: "moveCursor", dLat, dLon });
      },
      setTrack(track) {
        dispatch({ type: "setTrack", track });
        announce(t("announce.track", { track: trackName(track) }));
      },
      // The URL is the mode's one source: this navigates, and use-route-sync copies it into the state.
      setMode(mode) {
        void navigate(locationForMode(mode));
      },
      setLang(lang) {
        dispatch({ type: "setLang", lang });
      },
      toggleSetting(key) {
        dispatch({ type: "toggle", key });
        announce(t("announce.toggle", { name: t(SETTING_LABELS[key]), on: !state[key] }));
      },
      togglePlaying() {
        if (!state.soundOn) {
          void enableSound();
          return;
        }
        // Every tap is a user gesture: wake audio a phone suspended (a call, a
        // locked screen), even if the button still said "Pause". If the browser
        // refuses, the next tap tries again.
        void audio.ensureAudio().catch(() => {});
        dispatch({ type: "setPlaying", playing: !state.playing });
        announce(t(state.playing ? "sound.paused" : "sound.resumed"));
      },
      speakCurrent() {
        if (!fields) return;
        const reading = readAt(fields, state.cursor);
        void say((tl) => spokenReading(tl, reading, state.track, state.cursor), whisperSource(t, fields, state.track));
      },
      say,
      playSweep() {
        if (!fields) return;
        if (!state.soundOn) return soundOffHint();
        if (!fields.rain && state.track !== "ocean") {
          announce(t("sweep.needsRain"));
          return;
        }
        startSweep();
      },
      startSweep,
      playLegend() {
        if (!state.soundOn) return soundOffHint();
        if (state.track === "both") audio.playWarmup();
        else audio.playLegend(state.track);
      },
      playMotif() {
        if (!state.soundOn) return soundOffHint();
        if (sst) audio.playMotif(bandMeans(sst));
      },
      xray() {
        announce(t("xray.unavailable"));
      },
      openPanel(panel) {
        dispatch({ type: "setPanel", panel, open: true });
      },
      openHelp() {
        dispatch({ type: "setHelpOpen", open: true });
      },
      stopAll() {
        sayCount.current++;
        audio.stopAll();
        sweepRef.current = null;
        dispatch({ type: "introDone" }); // Esc also skips the opening
        dispatch({ type: "setPlaying", playing: false });
        dispatch({ type: "setHelpOpen", open: false });
        dispatch({ type: "setPanelOpen", open: false });
        // Ending a story: back to Explore, with one combined message.
        if (state.mode === "story") void navigate(locationForMode("explore"));
        announce(t(state.mode === "story" ? "story.stopped" : "sound.stopped"));
      },
      sweepRef,
    };
  }, [state, dispatch, fields, sst, announce, navigate]);

  return <CommandsContext.Provider value={commands}>{children}</CommandsContext.Provider>;
}
