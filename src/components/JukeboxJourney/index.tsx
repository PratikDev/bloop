"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { pushEscapeHandler } from "@/lib/escape";
import { useAppState, useT } from "../AppState/use-app-state";
import { MAP_REGION_ID } from "../ExploreControls";
import { JukeboxFrame } from "../JukeboxArt/Frame";
import { Starfield } from "../Starfield";
import { animateJourney, GROW_MS, REDUCED_MS } from "./animate-journey";
import { disarmJourney, isJourneyArmed, takeJourney } from "./journey-store";

/** Keeps the frame on screen at any window size. */
const FIT_WINDOW = "min(100vw - 7.5rem, 100dvh - 8.5rem)";
const HALF = { left: "inset(-1rem 50% -1rem -1rem)", right: "inset(-1rem -1rem -1rem 50%)" } as const;

function Stage({ from, reduced, onEnd }: { from: DOMRect; reduced: boolean; onEnd: () => void }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const arch = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const overlay = root.current;
    const backdrop = sky.current;
    if (!overlay || !backdrop) return;
    const crown = document.querySelector("[data-cabinet-crown]")?.getBoundingClientRect() ?? null;
    const animations =
      reduced || !stage.current || !left.current || !right.current || !arch.current
        ? [backdrop.animate({ opacity: [1, 0] }, { duration: REDUCED_MS, fill: "both" })]
        : animateJourney({ stage: stage.current, sky: backdrop, left: left.current, right: right.current, arch: arch.current }, from, crown);

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
    const clickThrough = setTimeout(() => (overlay.style.pointerEvents = "none"), reduced ? 0 : GROW_MS);
    void Promise.all(animations.map((a) => a.finished)).then(end, end);
    return () => {
      clearTimeout(clickThrough);
      release();
      window.removeEventListener("pointerdown", skip, true);
      window.removeEventListener("keydown", skip, true);
    };
  }, [from, reduced, onEnd]);

  const marquee = t("app.title");
  const front = (side: "left" | "right") => (
    <div ref={side === "left" ? left : right} style={{ clipPath: HALF[side] }} className="absolute inset-0">
      <JukeboxFrame marquee={marquee} layer="front" />
    </div>
  );
  return (
    <div ref={root} data-jukebox-journey aria-hidden="true" className="fixed inset-0 z-(--layer-journey) overflow-hidden">
      <div ref={sky} className="absolute inset-0 bg-space">
        {!reduced && <Starfield density="sparse" still />}
      </div>
      {!reduced && (
        <div className="absolute inset-0 grid place-items-center">
          <div ref={stage} style={{ "--jf-window": FIT_WINDOW } as React.CSSProperties} className="relative origin-top-left">
            {/* Takes the frame's size; the halves and the arch lie over it. */}
            <div className="invisible">
              <JukeboxFrame marquee={marquee} layer="front" />
            </div>
            {front("left")}
            {front("right")}
            <div ref={arch} className="absolute inset-0">
              <JukeboxFrame marquee={marquee} layer="arch" className="h-full" />
            </div>
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
        // Only if nobody has moved it: a key pressed on a link mid-journey must still land there.
        const active = document.activeElement;
        if (!active || active === document.body || active.id === MAP_REGION_ID) document.querySelector<HTMLElement>("[data-page-title]")?.focus({ preventScroll: true });
      }}
    />
  );
}
