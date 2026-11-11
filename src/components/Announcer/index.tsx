"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { clean } from "@/a11y/brailleText";
import { AnnouncerContext } from "./use-announcer";

const DEBOUNCE_MS = 250;

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flip = useRef(false);

  const announce = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // A trailing non-breaking space makes a repeated message count as new.
      flip.current = !flip.current;
      const said = clean(text);
      setMessage(flip.current ? `${said} ` : said);
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
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-region">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}
