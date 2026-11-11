"use client";

import { useEffect } from "react";
import { consumeEscape, escClosesOverlay } from "@/lib/escape";
import type { Commands } from "../Commands/use-commands";

export function useGlobalEscape(commands: Commands, alsoStop: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // A view may use this Esc for something smaller first (Turntable: close search, stop a tour).
      if (consumeEscape()) {
        e.preventDefault();
        return;
      }
      commands.stopAll({ leave: !escClosesOverlay(e.target instanceof Element ? e.target : null) });
      alsoStop();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [commands, alsoStop]);
}
