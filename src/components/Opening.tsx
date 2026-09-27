"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle } from "@/lib/audio-adapter/types";
import { openingPath } from "@/lib/data";
import { captionText } from "@/lib/i18n";
import { useAnnounce } from "./Announcer/use-announcer";
import { useAppState, useT } from "./AppState/use-app-state";
import { useLatestCaption } from "./CaptionBar/use-latest-caption";
import { useLiveData } from "./LiveData/use-live-data";
import { Waveform } from "./Waveform";

const OPENING_KEYS = new Set(["caption.opening.closeEyes", "caption.opening.openEyes"]);

/**
 * "Close your eyes" (feature C1): real ocean and rain sound over darkness, the
 * live waveform as a single line, then the frame opens out from the equator
 * (the reveal animation lives on the map). The only sequence the user doesn't
 * drive; Skip or Esc ends it at any time.
 */
export function Opening() {
  const { state, dispatch } = useAppState();
  const { fields, sstStatus } = useLiveData();
  const announce = useAnnounce();
  const t = useT();
  const caption = useLatestCaption();
  const handleRef = useRef<PlayerHandle | null>(null);
  const active = state.started && !state.introDone;
  const line = caption && OPENING_KEYS.has(caption.key) ? captionText(state.lang, caption.key, caption.params) : "";

  useEffect(() => {
    if (!active || !fields || handleRef.current) return;
    const handle = audio.playOpening(openingPath(fields));
    handleRef.current = handle;
    const started = t("announce.started");
    void handle.done.then(() => {
      dispatch({ type: "introDone" });
      announce(started);
    });
  }, [active, fields, dispatch, announce, t]);

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

  if (!active) return null;
  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-10 bg-night px-4">
      <p className="min-h-10 text-center font-serif text-title text-moon">{line}</p>
      <Waveform className="h-24 w-full max-w-3xl" />
      <Button autoFocus variant="secondary" onClick={skip} className="h-11 px-5 text-body">
        {t("start.skipIntro")}
      </Button>
    </div>
  );
}
