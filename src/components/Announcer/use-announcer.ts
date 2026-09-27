"use client";

import { createContext, useContext } from "react";

/** Queues text for the page's single polite live region (debounced). */
export type Announce = (text: string) => void;

export const AnnouncerContext = createContext<Announce | null>(null);

export function useAnnounce(): Announce {
  const announce = useContext(AnnouncerContext);
  if (!announce) throw new Error("useAnnounce must be used inside <AnnouncerProvider>");
  return announce;
}
