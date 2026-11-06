import { useEffect } from "react";
import { stopAll } from "@/lib/audio";

/** Esc stops every sound, as it will in the app (AUDIO_RESEARCH C5). */
export function useStopOnEscape(onStopped?: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      stopAll();
      onStopped?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStopped]);
}
