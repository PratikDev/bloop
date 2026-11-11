import { useState, type FocusEvent } from "react";

export function useHeldName(live: string, ready: boolean) {
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState<string | null>(null);
  if (focused && ready && held === null) setHeld(live);
  if (!focused && held !== null) setHeld(null);
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
