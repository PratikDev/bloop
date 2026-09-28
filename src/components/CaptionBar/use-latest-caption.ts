"use client";

import { useEffect, useState } from "react";
import { onCaption, type CaptionEvent } from "@/lib/ui-captions";

export type { CaptionEvent };

/** The most recent caption, from the sound engine or the UI (spoken lines, History). */
export function useLatestCaption(): CaptionEvent | null {
  const [caption, setCaption] = useState<CaptionEvent | null>(null);
  useEffect(() => onCaption(setCaption), []);
  return caption;
}
