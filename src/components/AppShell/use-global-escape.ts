"use client";

import { useEffect } from "react";
import { consumeEscape } from "@/lib/escape";
import { useAppState } from "../AppState/use-app-state";
import type { Commands } from "../Commands/use-commands";

/** Open dialogs, sheets, popovers and menus (Base UI marks an open popup with data-open). */
const OPEN_POPUP = '[role="dialog"][data-open], [role="alertdialog"][data-open], [role="menu"][data-open], [role="listbox"][data-open]';

/**
 * Esc closes the top layer first, then stops all sound (plan §9.3):
 * - a view may claim it for something smaller (Turntable: close search, stop a tour; the intro: skip);
 * - an open Help, Inspector, sheet, popover or menu takes it and closes, and the sound keeps playing;
 * - with nothing open, Esc stops all sound. `alsoStop` covers things that run without sound (the silent time-lapse).
 * Capture phase, so this runs before an open popup handles the same key.
 */
export function useGlobalEscape(commands: Commands, alsoStop: () => void): void {
  const { state, dispatch } = useAppState();
  const { helpOpen, panelOpen } = state;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (consumeEscape()) {
        e.preventDefault();
        return;
      }
      if (helpOpen) {
        dispatch({ type: "setHelpOpen", open: false });
        return;
      }
      // Base UI closes its own popup on this same key press; only the popup goes.
      if (document.querySelector(OPEN_POPUP)) return;
      if (panelOpen) {
        dispatch({ type: "setPanelOpen", open: false });
        return;
      }
      commands.stopAll();
      alsoStop();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [commands, alsoStop, helpOpen, panelOpen, dispatch]);
}
