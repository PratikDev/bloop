"use client";

import { cn } from "@/lib/utils";
import { captionText } from "@/lib/i18n";
import { readAt, readingText } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useLatestCaption } from "./use-latest-caption";

/**
 * A caption for every sound event (plan §9.4), in Tiro Bangla. Visual only:
 * the live region already speaks values, so this never talks over it.
 * With sound off, it shows the reading under the cursor instead.
 */
export function CaptionBar({ className }: { className?: string }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const caption = useLatestCaption();
  if (!state.captions) return null;
  const text = !state.soundOn
    ? fields && readingText(t, readAt(fields, state.cursor), state.track)
    : caption && captionText(state.lang, caption.key, caption.params);
  return (
    <p aria-hidden="true" className={cn("min-h-8 truncate font-serif text-lead text-moon", className)}>
      {text || " "}
    </p>
  );
}
