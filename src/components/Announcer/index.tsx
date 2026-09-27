"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnnouncerContext } from "./use-announcer";

const DEBOUNCE_MS = 300;

/**
 * The one aria-live region (plan §9.4). Rapid updates (holding an arrow key)
 * collapse into the last one, so screen readers hear the settled value.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flip = useRef(false);

  const announce = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // A trailing non-breaking space makes a repeated message count as new.
      flip.current = !flip.current;
      setMessage(flip.current ? `${text} ` : text);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-region">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}
