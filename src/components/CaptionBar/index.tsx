"use client";

import { cn } from "@/lib/utils";
import { captionText } from "@/lib/i18n";
import { readingText } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useLatestCaption } from "./use-latest-caption";

/**
 * A caption for every sound event (plan §9.4), in Tiro Bangla. Visual only:
 * the live region already speaks values, so this never talks over it.
 * With sound off, it shows the reading being shown (the cursor, or the
 * time-lapse frame) instead.
 */
export function CaptionBar({ className }: { className?: string }) {
  const { state } = useAppState();
  const shown = useShownPoint();
  const t = useT();
  const caption = useLatestCaption();
  if (!state.captions) return null;
  const text = !state.soundOn
    ? shown.reading && readingText(t, shown.reading, shown.track)
    : caption && captionText(state.lang, caption.key, caption.params);
  return (
    <p aria-hidden="true" className={cn("min-h-8 truncate font-serif text-lead text-moon", className)}>
      {text || " "}
    </p>
  );
}
