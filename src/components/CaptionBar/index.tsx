"use client";

import { cn } from "@/lib/utils";
import { captionText } from "@/lib/i18n";
import { readingText } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useDescribe } from "./use-describe";
import { useLatestCaption } from "./use-latest-caption";

/**
 * A caption for every sound event (plan §9.4). Visual only:
 * the live region already speaks values, so this never talks over it.
 * With sound off, it shows the reading being shown (the cursor, or the
 * time-lapse frame) instead.
 */
export function CaptionBar({ className, fade = false }: { className?: string; /** Each new caption shows for 3 s, then fades (Turntable). */ fade?: boolean }) {
  const { state } = useAppState();
  const shown = useShownPoint();
  const t = useT();
  const caption = useLatestCaption();
  useDescribe();
  if (!state.captions) return null;
  const text = !state.soundOn
    ? shown.reading && readingText(t, shown.reading, shown.track)
    : caption && captionText(state.lang, caption.key, caption.params);
  return (
    // Up to two lines rather than cut off: long captions stay readable. With nothing to say the box keeps its place, unseen.
    <p key={fade ? text || "" : undefined} aria-hidden="true" className={cn("comic-box min-h-8 rounded-caption px-2.5 py-1 text-lead", fade && "caption-fade", !text && "invisible", className)}>
      <span className="line-clamp-2">{text || " "}</span>
    </p>
  );
}
