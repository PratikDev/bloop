"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { audio } from "@/lib/audio-adapter";
import { bandMeans, DHAKA, sweepPath } from "@/lib/data";
import { bindT } from "@/lib/i18n";
import { spokenReading, readAt } from "@/lib/reading";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { CommandsContext, SETTING_LABELS, type Commands, type SweepVisual } from "./use-commands";
import { useSoundSync } from "./use-sound-sync";

export function CommandsProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState();
  const { fields, sst } = useLiveData();
  const announce = useAnnounce();
  const sweepRef = useRef<SweepVisual | null>(null);
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
      setMode(mode) {
        if (mode !== "explore") {
          announce(t("mode.notReady"));
          return;
        }
        dispatch({ type: "setMode", mode });
        announce(t("announce.mode", { mode: t("mode.explore") }));
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
        dispatch({ type: "setPlaying", playing: !state.playing });
        announce(t(state.playing ? "sound.paused" : "sound.resumed"));
      },
      speakCurrent() {
        if (!fields) return;
        const text = spokenReading(t, readAt(fields, state.cursor), state.track, state.cursor);
        // Two voices never talk at once: built-in speech OR the live region.
        // With sound off, nothing is spoken aloud.
        if (state.builtInVoice && state.soundOn) void audio.speak(text, state.lang);
        else announce(text);
      },
      playSweep() {
        if (!fields) return;
        if (!state.soundOn) return soundOffHint();
        if (!fields.rain && state.track !== "ocean") {
          announce(t("sweep.needsRain"));
          return;
        }
        const path = sweepPath(fields, DHAKA);
        sweepRef.current = { ...path, center: DHAKA };
        audio.playSweep(path.points);
      },
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
        audio.stopAll();
        sweepRef.current = null;
        dispatch({ type: "introDone" }); // Esc also skips the opening
        dispatch({ type: "setPlaying", playing: false });
        dispatch({ type: "setHelpOpen", open: false });
        dispatch({ type: "setPanelOpen", open: false });
        announce(t("sound.stopped"));
      },
      sweepRef,
    };
  }, [state, dispatch, fields, sst, announce]);

  return <CommandsContext.Provider value={commands}>{children}</CommandsContext.Provider>;
}
