"use client";

import { useEffect, useState } from "react";
import { onCaption, type CaptionEvent } from "@/lib/ui-captions";

export type { CaptionEvent };

/**
 * The most recent caption, from the sound engine or the UI (spoken lines, History). A new `scope` (another page, or
 * a player starting or stopping) forgets it, so a caption never outlives the record it belongs to.
 */
export function useLatestCaption(scope = ""): CaptionEvent | null {
  const [caption, setCaption] = useState<CaptionEvent | null>(null);
  const [shownScope, setShownScope] = useState(scope);
  if (scope !== shownScope) {
    setShownScope(scope);
    setCaption(null);
  }
  useEffect(() => onCaption(setCaption), []);
  return scope === shownScope ? caption : null;
}
