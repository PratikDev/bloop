"use client";

import { cn } from "cn";
import { captionText } from "@/lib/i18n";
import { useAppState } from "../AppState/use-app-state";
import { useLatestCaption } from "./use-latest-caption";

/**
 * A caption for every sound event (plan §9.4), in Tiro Bangla. Visual only:
 * the live region already speaks values, so this never talks over it.
 */
export function CaptionBar({ className }: { className?: string }) {
  const { state } = useAppState();
  const caption = useLatestCaption();
  if (!state.captions) return null;
  return (
    <p aria-hidden="true" className={cn("min-h-8 truncate font-serif text-lead text-moon", className)}>
      {caption ? captionText(state.lang, caption.key, caption.params) : " "}
    </p>
  );
}
