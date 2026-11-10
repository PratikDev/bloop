import { useState, type FocusEvent } from "react";

/**
 * The sound map's accessible name. NVDA reads a focused item's name change aloud, so a name that follows every step
 * repeats what the status region already says (NVDA log run, 10 Nov 2026: each step was heard twice, in Chromium and
 * Firefox). So the name is the reading as the map is reached (the first reading, if the map is reached while it loads)
 * and holds still while focus stays on the map; the status region says each step once. Off the map it follows the
 * reading again, so Tab or a click back onto the map reads where the needle is now.
 */
export function useHeldName(live: string, ready: boolean) {
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState<string | null>(null);
  // Derived during render (React's "adjusting state when a prop changes"): taken once a reading is there, dropped off focus.
  if (focused && ready && held === null) setHeld(live);
  if (!focused && held !== null) setHeld(null);
  // The map's own focus only: a control inside it (focus inside, then out) doesn't count.
  const own = (e: FocusEvent) => e.target === e.currentTarget;
  return {
    name: held ?? live,
    onFocus: (e: FocusEvent) => {
      if (own(e)) setFocused(true);
    },
    onBlur: (e: FocusEvent) => {
      if (own(e)) setFocused(false);
    },
  };
}
