"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isAbort } from "@/lib/abortable";
import { audio } from "@/lib/audio-adapter";
import { bindT } from "@/lib/i18n";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { runStory } from "./script";
import { StoryContext, type StoryFocus, type StoryLine, type StoryStatus, type StoryStepId, type StoryValue } from "./use-story";

/**
 * Story Mode (plan C3): a scripted tour that starts when the Story tab is
 * chosen. Esc, Stop or another mode ends it at once.
 */
export function StoryProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState();
  const { fields } = useLiveData();
  const commands = useCommands();
  const timeLapse = useTimeLapse();
  const [status, setStatus] = useState<StoryStatus>("idle");
  const [step, setStep] = useState<StoryStepId | null>(null);
  const [line, setLine] = useState<StoryLine | null>(null);
  const [focus, setFocus] = useState<StoryFocus | null>(null);
  const controller = useRef<AbortController | null>(null);

  // The script runs across many renders; it reads the newest values through this.
  const latest = useRef({ state, fields, commands, timeLapse });
  useEffect(() => {
    latest.current = { state, fields, commands, timeLapse };
  });

  const halt = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setStatus("idle");
    setStep(null);
    setLine(null);
    setFocus(null);
  }, []);

  const play = useCallback(() => {
    const { state: s, fields: f, commands: c } = latest.current;
    if (!f) return;
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setStatus("playing");
    c.sweepRef.current = null;
    audio.silenceLive();
    runStory({
      signal: ctrl.signal,
      t: bindT(s.lang),
      soundOn: s.soundOn,
      fields: () => latest.current.fields ?? f,
      enterStep(id, at) {
        setStep(id);
        setFocus(at);
      },
      say(line, source) {
        // On screen in the chosen language (Bangla subtitles); speech may be English (plan §17).
        setLine({ text: line(bindT(s.lang), s.lang), source: source?.full ?? null });
        return latest.current.commands.say(line, source);
      },
      startSweep: () => latest.current.commands.startSweep(),
      playStorm: (framesAroundPeak) => latest.current.timeLapse.start({ framesAroundPeak }),
      openTruth: () => dispatch({ type: "setPanel", panel: "truth", open: true }),
    })
      .then(() => {
        if (ctrl.signal.aborted) return;
        controller.current = null;
        setStatus("finished");
        setStep(null);
      })
      .catch((e: unknown) => {
        if (!isAbort(e)) throw e;
      })
      .finally(() => {
        // Hand the engine back as Explore left it.
        audio.silenceLive();
        audio.setTrackMode(latest.current.state.track);
      });
  }, [dispatch]);

  // Choosing the Story tab starts the tour; leaving it stops everything it started.
  const inStory = state.mode === "story" && fields !== null;
  useEffect(() => {
    if (!inStory) return;
    play();
    return () => {
      const running = controller.current !== null;
      halt();
      if (!running) return;
      latest.current.timeLapse.stop();
      audio.stopAll();
    };
  }, [inStory, play, halt]);

  // Stop story does what Esc does (the global Esc handler): stop, back to Explore, one message.
  const exit = useCallback(() => latest.current.commands.stopAll(), []);

  const value = useMemo<StoryValue>(
    () => ({ status, step, line, focus, replay: play, exit }),
    [status, step, line, focus, play, exit],
  );
  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}
