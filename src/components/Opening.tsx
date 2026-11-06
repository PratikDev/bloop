"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { EASE_OUT_SOFT } from "@/lib/motion";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle } from "@/lib/audio-adapter/types";
import { openingPath } from "@/lib/data";
import { captionText } from "@/lib/i18n";
import { useAnnounce } from "./Announcer/use-announcer";
import { useAppState, useT } from "./AppState/use-app-state";
import { useLatestCaption } from "./CaptionBar/use-latest-caption";
import { useLiveData } from "./LiveData/use-live-data";
import { SignalMark } from "./SignalMark";
import { Waveform } from "./Waveform";

const OPENING_KEYS = new Set(["caption.opening.closeEyes", "caption.opening.openEyes"]);
// The rain grid starts loading at Start; the opening waits this long for it, then plays the ocean alone.
const RAIN_WAIT_MS = 4000;

/**
 * "Close your eyes" (feature C1): real ocean and rain sound over darkness, the
 * live waveform as a single line, then the frame opens out from the equator
 * (the reveal animation lives on the map). The only sequence the user doesn't
 * drive; Skip or Esc ends it at any time.
 */
export function Opening() {
  const { state, dispatch } = useAppState();
  const { fields, sstStatus, rainStatus } = useLiveData();
  const announce = useAnnounce();
  const t = useT();
  const caption = useLatestCaption();
  const handleRef = useRef<PlayerHandle | null>(null);
  const [rainWaitOver, setRainWaitOver] = useState(false);
  const active = state.started && !state.introDone;
  const rainSettled = rainStatus !== "loading" || rainWaitOver;
  const openingLine = caption && OPENING_KEYS.has(caption.key) ? captionText(state.lang, caption.key, caption.params) : "";
  const line = openingLine || (rainSettled ? "" : t("badge.loadingRain"));

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setRainWaitOver(true), RAIN_WAIT_MS);
    return () => clearTimeout(id);
  }, [active]);

  useEffect(() => {
    if (!active || !fields || !rainSettled || handleRef.current) return;
    const handle = audio.playOpening(openingPath(fields));
    handleRef.current = handle;
    const started = t("announce.started");
    void handle.done.then(() => {
      dispatch({ type: "introDone" });
      announce(started);
    });
  }, [active, fields, rainSettled, dispatch, announce, t]);

  useEffect(() => {
    if (active && line) announce(line);
  }, [active, line, announce]);

  // Without the ocean data there is nothing to play: go straight to the app,
  // where the error message explains what happened.
  useEffect(() => {
    if (active && sstStatus === "error") dispatch({ type: "introDone" });
  }, [active, sstStatus, dispatch]);

  // Skip works whether or not the sound has started yet.
  const skip = () => {
    handleRef.current?.stop();
    dispatch({ type: "introDone" });
  };

  // Its own stage, unlike any page: near-black, a breathing glow, a big signal
  // ring, no header or dock. It fades away as the map opens from the equator.
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="opening"
          role="region"
          aria-label={t("opening.label")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // Click-through while it fades, so the map is usable the moment the intro ends.
          exit={{ opacity: 0, pointerEvents: "none", transition: { duration: 0.8, ease: EASE_OUT_SOFT } }}
          className="fixed inset-0 z-(--layer-opening) grid grid-rows-[auto_1fr_auto] overflow-hidden bg-void px-5 py-6 md:px-10 md:py-8"
        >
          <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 size-[min(120vw,70rem)] -translate-x-1/2 -translate-y-1/2">
            <div className="size-full animate-breathe rounded-full bg-radial from-tide from-0% via-land/35 via-35% to-transparent to-70%" />
          </div>

          <p className="eyebrow relative flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-shapla" />
            {t("opening.label")}
          </p>

          <div className="relative flex flex-col items-center justify-center gap-10">
            <SignalMark className="size-16 md:size-20" />
            <AnimatePresence mode="wait">
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
                className="display-tight min-h-20 max-w-3xl text-center font-serif text-display text-moon italic"
              >
                {line}
              </motion.p>
            </AnimatePresence>
            <Waveform className="h-24 w-full max-w-2xl" />
          </div>

          <div className="relative flex flex-col items-center gap-2 md:flex-row md:justify-end md:gap-4">
            <span className="order-last text-small text-haze pointer-coarse:hidden md:order-first">{t("opening.escHint")}</span>
            <Button
              autoFocus
              onClick={skip}
              className="group h-12 gap-2 rounded-full bg-moon px-6 text-body text-ink hover:bg-moon/90 active:scale-[0.98]"
            >
              {t("start.skipIntro")}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
