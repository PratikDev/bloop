"use client";

import { useEffect } from "react";
import type { Commands } from "../Commands/use-commands";

/** Esc stops all sound and closes panels from anywhere on the page (plan §9.3). */
export function useGlobalEscape(commands: Commands): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") commands.stopAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commands]);
}
