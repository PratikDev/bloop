"use client";

import { useEffect, useRef } from "react";
import type { CaptionParams } from "@/lib/audio-adapter/types";
import { captionText } from "@/lib/i18n";
import { isDescribeHeld, onCaption, type CaptionEvent } from "@/lib/ui-captions";
import type { AppState } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { useCommands, type Line } from "../Commands/use-commands";

/** A caption as a line to say: the same words Describe would speak for it. */
export function captionLine(key: string, params: CaptionParams = {}): Line {
  return (_t, lang) => captionText(lang, key, params);
}

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
 * region, never both. Off during Story Mode, which narrates itself, and
 * while a narrated sound plays (its line was said before it).
 */
export function useDescribe(): void {
  const { state } = useAppState();
  const { say } = useCommands();
  const latest = useRef({ on: false, say });
  useEffect(() => {
    latest.current = { on: describeOn(state), say };
  });

  useEffect(() => {
    return onCaption((e: CaptionEvent) => {
      if (!latest.current.on || isDescribeHeld() || !DESCRIBED.has(e.key)) return;
      void latest.current.say(captionLine(e.key, e.params));
    });
  }, []);
}

/** Whether Describe mode speaks on this page. */
export function describeOn(state: Pick<AppState, "describe" | "mode">): boolean {
  return state.describe && state.mode !== "story";
}
