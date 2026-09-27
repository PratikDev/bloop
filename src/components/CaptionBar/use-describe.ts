"use client";

import { useEffect, useRef } from "react";
import { audio } from "@/lib/audio-adapter";
import { captionText } from "@/lib/i18n";
import { onUiCaption, type CaptionEvent } from "@/lib/ui-captions";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

/**
 * Captions Describe mode says aloud: what is playing, not every value.
 * Left out: live values and no-data ticks (they change with every cursor
 * move; Enter speaks them), the opening (announced by the opening itself),
 * earcons, stops, and spoken lines.
 */
const DESCRIBED = new Set([
  "caption.sweep.start",
  "caption.sweep.end",
  "caption.timelapse.start",
  "caption.timelapse.peak",
  "caption.timelapse.end",
  "caption.legend",
  "caption.legendUnavailable",
  "caption.warmup.start",
  "caption.warmup.end",
  "caption.motif",
  "caption.thenNow.caption",
  "caption.thenNow.window",
  "caption.thenNow.end",
  "caption.water.gap",
  "caption.water.windowStart",
  "caption.water.windowEnd",
  "caption.compare.side",
  "caption.compare.useHeadphones",
  "caption.history.end",
]);

/**
 * Describe mode (plan H5, key D): spoken descriptions during playback. Goes
 * through say(), so the two-voices rule holds: the built-in voice or the live
 * region, never both. Off during Story Mode, which narrates itself.
 */
export function useDescribe(): void {
  const { state } = useAppState();
  const { say } = useCommands();
  const latest = useRef({ on: false, say });
  useEffect(() => {
    latest.current = { on: state.describe && state.mode !== "story", say };
  });

  useEffect(() => {
    const describe = (e: CaptionEvent) => {
      if (!latest.current.on || !DESCRIBED.has(e.key)) return;
      void latest.current.say((_t, lang) => captionText(lang, e.key, e.params));
    };
    const offEngine = audio.onAudioEvent((e) => {
      if (e.kind === "caption") describe({ key: e.key, params: e.params });
    });
    const offUi = onUiCaption(describe);
    return () => {
      offEngine();
      offUi();
    };
  }, []);
}
