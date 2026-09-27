"use client";

import { useEffect, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import type { CaptionParams } from "@/lib/audio-adapter/types";

export interface CaptionEvent {
  key: string;
  params: CaptionParams;
}

/** The most recent caption event from the sound engine. */
export function useLatestCaption(): CaptionEvent | null {
  const [caption, setCaption] = useState<CaptionEvent | null>(null);
  useEffect(
    () =>
      audio.onAudioEvent((e) => {
        if (e.kind === "caption") setCaption({ key: e.key, params: e.params });
      }),
    [],
  );
  return caption;
}
