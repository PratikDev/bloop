"use client";

import type { CSSProperties } from "react";
import { SOUND_WORDS, type SoundWordId } from "@/lib/sound-words";
import { cn } from "@/lib/utils";
import { useAppState } from "./AppState/use-app-state";

const SIZES = {
  map: "px-2 py-0.5 text-title", // 22 px
  legend: "px-3 py-1 text-value", // 44 px
} as const;

/** A comic sound word, drawn only: captions and the Announcer already carry the information. */
export function SoundWord({ id, size, pop = false, className, style }: { id: SoundWordId; size: keyof typeof SIZES; pop?: boolean; className?: string; style?: CSSProperties }) {
  const { state } = useAppState();
  return (
    <span aria-hidden="true" translate="no" style={style} className={cn("comic-box inline-block -rotate-3 rounded-caption font-wide leading-tight whitespace-nowrap", SIZES[size], pop && "animate-sound-word", className)}>
      {SOUND_WORDS[id][state.lang]}
    </span>
  );
}
