"use client";

import { useEffect, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import { onUiCaption, type CaptionEvent } from "@/lib/ui-captions";

export type { CaptionEvent };

/** The most recent caption, from the sound engine or the UI (spoken lines, History). */
export function useLatestCaption(): CaptionEvent | null {
  const [caption, setCaption] = useState<CaptionEvent | null>(null);
  useEffect(() => {
    const offEngine = audio.onAudioEvent((e) => {
      if (e.kind === "caption") setCaption({ key: e.key, params: e.params });
    });
    const offUi = onUiCaption(setCaption);
    return () => {
      offEngine();
      offUi();
    };
  }, []);
  return caption;
}
