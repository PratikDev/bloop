"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { pushEscapeHandler } from "@/lib/escape";
import { useAppState, useT } from "../AppState/use-app-state";
import { JukeboxArt } from "../JukeboxArt";
import { Starfield } from "../Starfield";
import { animateJourney, fitToScreen, GROW_MS, REDUCED_MS } from "./animate-journey";
import { disarmJourney, isJourneyArmed, takeJourney } from "./journey-store";

function Stage({ from, reduced, onEnd }: { from: DOMRect; reduced: boolean; onEnd: () => void }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const [fit] = useState(fitToScreen);

  useLayoutEffect(() => {
    const stage = root.current;
    const backdrop = sky.current;
    if (!stage || !backdrop) return;
    const crown = document.querySelector("[data-cabinet-crown]")?.getBoundingClientRect() ?? null;
    const animations =
      reduced || !art.current
        ? [backdrop.animate({ opacity: [1, 0] }, { duration: REDUCED_MS, fill: "both" })]
        : animateJourney(art.current.firstElementChild as HTMLElement, backdrop, from, fit, crown);

    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      onEnd();
    };
    const skip = () => animations.forEach((a) => a.finish());
    // Esc jumps to the end and the sound keeps playing: the journey claims it from the global Esc.
    const release = pushEscapeHandler(() => {
      skip();
      return true;
    });
    window.addEventListener("pointerdown", skip, true);
    window.addEventListener("keydown", skip, true);
    const clickThrough = setTimeout(() => (stage.style.pointerEvents = "none"), reduced ? 0 : GROW_MS);
    void Promise.all(animations.map((a) => a.finished)).then(end, end);
    return () => {
      clearTimeout(clickThrough);
      release();
      window.removeEventListener("pointerdown", skip, true);
      window.removeEventListener("keydown", skip, true);
    };
  }, [from, fit, reduced, onEnd]);

  return (
    <div ref={root} data-jukebox-journey aria-hidden="true" className="fixed inset-0 z-(--layer-journey) overflow-hidden">
      <div ref={sky} className="absolute inset-0 bg-space">
        {!reduced && <Starfield density="sparse" still />}
      </div>
      {!reduced && (
        <div ref={art}>
          <div style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height }} className="absolute origin-top-left">
            <JukeboxArt marquee={t("app.title")} coin className="size-full" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Opening the jukebox into Listen, once a session, after the intro. Listen is already there underneath. */
export function JukeboxJourney() {
  const { state } = useAppState();
  const [from, setFrom] = useState<DOMRect | null>(null);
  const { mode, introDone, started, reduceMotion } = state;

  useEffect(() => {
    if (mode !== "home" && mode !== "explore") disarmJourney();
    if (mode !== "explore" || !started || !introDone || !isJourneyArmed()) return;
    // Taken once, when the intro is over: this effect only re-runs on those changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrom(takeJourney());
  }, [mode, started, introDone]);

  if (!from) return null;
  return (
    <Stage
      from={from}
      reduced={reduceMotion}
      onEnd={() => {
        setFrom(null);
        document.querySelector<HTMLElement>("[data-page-title]")?.focus({ preventScroll: true });
      }}
    />
  );
}
