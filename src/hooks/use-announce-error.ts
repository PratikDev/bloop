"use client";

import { useEffect } from "react";
import { useAnnounce } from "@/components/Announcer/use-announcer";

/** Says a failure once, through the page's one live region, when it appears. Null while there is none. */
export function useAnnounceError(text: string | null): void {
  const announce = useAnnounce();
  useEffect(() => {
    if (text) announce(text);
  }, [text, announce]);
}
