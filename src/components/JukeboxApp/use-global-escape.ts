"use client";

import { useEffect } from "react";
import type { Commands } from "../Commands/use-commands";

/**
 * Esc stops all sound and closes panels from anywhere on the page (plan §9.3).
 * `alsoStop` covers things that run without sound (the silent time-lapse).
 */
export function useGlobalEscape(commands: Commands, alsoStop: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      commands.stopAll();
      alsoStop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commands, alsoStop]);
}
