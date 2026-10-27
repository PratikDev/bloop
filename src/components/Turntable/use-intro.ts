"use client";

import { useEffect, useState } from "react";
import type { Turntable } from "./use-turntable";

const SESSION_KEY = "turntable-intro-seen";
/** Fade from black, camera glide, arm swing and drop, data fades in: under 4 s in all. */
export const INTRO_MS = 3800;
const READY_POLL_MS = 150;
/** Start anyway after this long, even if the Earth textures are still loading. */
const READY_TIMEOUT_MS = 10_000;

export type IntroPhase = "waiting" | "running" | "done";

/** Whether this visit plays the intro: once per session, never with reduced motion. */
export function introWanted(reduceMotion: boolean): boolean {
  if (reduceMotion) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === null;
  } catch {
    return true;
  }
}

/**
 * The intro: black until the Earth textures are ready, then the camera glides
 * in from a wide product shot while the arm swings onto the globe (the crackle
 * earcon on touchdown, then the data voice). Any key or click skips it.
 */
export function useIntro(tt: Turntable, wanted: boolean): { phase: IntroPhase; skip(): void } {
  const [phase, setPhase] = useState<IntroPhase>(wanted ? "waiting" : "done");
  const { sceneRef, startIntro, skipIntro } = tt;

  useEffect(() => {
    if (phase !== "waiting") return;
    const since = performance.now();
    const id = setInterval(() => {
      const ready = sceneRef.current?.info().surface != null;
      if (!ready && performance.now() - since < READY_TIMEOUT_MS) return;
      if (!sceneRef.current) return;
      clearInterval(id);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Private mode: the intro may play again next time; nothing else depends on it.
      }
      startIntro();
      setPhase("running");
    }, READY_POLL_MS);
    return () => clearInterval(id);
  }, [phase, sceneRef, startIntro]);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setTimeout(() => setPhase("done"), INTRO_MS);
    return () => clearTimeout(id);
  }, [phase]);

  const skip = () => {
    if (phase === "done") return;
    if (phase === "waiting") startIntro();
    skipIntro();
    setPhase("done");
  };

  // Any key or click skips (the key itself is not passed on to the turntable).
  useEffect(() => {
    if (phase === "done") return;
    const onInput = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      skip();
    };
    window.addEventListener("keydown", onInput, { capture: true });
    window.addEventListener("pointerdown", onInput, { capture: true });
    return () => {
      window.removeEventListener("keydown", onInput, { capture: true });
      window.removeEventListener("pointerdown", onInput, { capture: true });
    };
  });

  return { phase, skip };
}
