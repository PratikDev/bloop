"use client";

import { useCallback, useState } from "react";
import type { DegreeStyle } from "@/a11y/brailleText";

/** Display widths offered (cells); 40 is the default, as in MAIDR. */
export const BRAILLE_WIDTHS = [14, 20, 32, 40, 80] as const;
type BrailleWidth = (typeof BRAILLE_WIDTHS)[number];

interface BrailleSettings {
  width: BrailleWidth;
  /** The shape line's field: a multi-line text area or a single-line input (which routes better is a viewer test). */
  field: "textarea" | "input";
  degree: DegreeStyle;
  /** The visual braille preview under the explorer (for sighted helpers and demos). */
  preview: boolean;
}

const DEFAULT_BRAILLE_SETTINGS: BrailleSettings = { width: 40, field: "textarea", degree: "word", preview: false };

const KEY = "bloop.braille.v1";

function read(): BrailleSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BRAILLE_SETTINGS;
    const s = { ...DEFAULT_BRAILLE_SETTINGS, ...(JSON.parse(raw) as Partial<BrailleSettings>) };
    return BRAILLE_WIDTHS.includes(s.width) ? s : DEFAULT_BRAILLE_SETTINGS;
  } catch {
    return DEFAULT_BRAILLE_SETTINGS;
  }
}

/**
 * The reader's braille settings, kept in this browser (a convenience: the page works the same without storage).
 * Read on first render: the explorer and text views mount only after a click or key, never on the server.
 */
export function useBrailleSettings(): [BrailleSettings, (patch: Partial<BrailleSettings>) => void] {
  const [settings, setSettings] = useState<BrailleSettings>(() => (typeof window === "undefined" ? DEFAULT_BRAILLE_SETTINGS : read()));
  const update = useCallback((patch: Partial<BrailleSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Private window or blocked storage: the setting holds for this visit only.
      }
      return next;
    });
  }, []);
  return [settings, update];
}
