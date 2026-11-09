"use client";

import { FLAGS } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { captionText } from "@/lib/i18n";
import { readingText } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useDescribe } from "./use-describe";
import { useLatestCaption } from "./use-latest-caption";
import { useSoundCaption } from "./use-sound-caption";

/**
 * A caption for every sound event (plan §9.4), in Tiro Bangla. Visual only:
 * the live region already speaks values, so this never talks over it.
 * With sound off, it shows the reading being shown (the cursor, or the
 * time-lapse frame) instead.
 */
export function CaptionBar({ className, fade = false }: { className?: string; /** Each new caption shows for 3 s, then fades (Turntable). */ fade?: boolean }) {
  const { state } = useAppState();
  const shown = useShownPoint();
  const t = useT();
  const caption = useLatestCaption();
  const sound = useSoundCaption();
  useDescribe();
  if (!state.captions) return null;
  const text = !state.soundOn
    ? shown.reading && readingText(t, shown.reading, shown.track)
    : caption && captionText(state.lang, caption.key, caption.params);
  return (
    // Up to two lines rather than cut off: long captions stay readable. Below it, the sound caption (step 7): what the
    // last sound did, or the timed track's "now playing" line.
    <div aria-hidden="true" className={cn("min-w-0 font-serif text-lead text-moon", className)}>
      <p key={fade ? text || "" : undefined} data-testid="caption-bar" className={cn("line-clamp-2 min-h-8", fade && "caption-fade")}>
        {text || " "}
      </p>
      {FLAGS.timedText && state.soundOn && sound && (
        <p data-testid="sound-caption" className="line-clamp-1 font-sans text-small text-haze">
          {sound}
        </p>
      )}
    </div>
  );
}
