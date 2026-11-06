"use client";

import { useEffect, useState } from "react";
import { HandTap } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { SPRING } from "@/lib/motion";
import { useAppState, useT } from "../../AppState/use-app-state";

const SEEN_KEY = "jukebox.hint.map.v1";

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: the hint may show again next visit, which is harmless.
  }
}

/**
 * The first visit only: how to move around the map. It goes away with "Got it"
 * or as soon as the cursor moves, and doesn't come back on this device.
 * Screen readers already get the same from the map's own instructions.
 */
export function FirstHint() {
  const { state } = useAppState();
  const t = useT();
  const [open, setOpen] = useState(() => !seen());
  // Where the cursor was when the page opened: any move after that counts as "got it".
  const [start] = useState(state.cursor);
  const moved = state.cursor !== start;

  useEffect(() => {
    if (open && moved) remember();
  }, [open, moved]);

  const dismiss = () => {
    remember();
    setOpen(false);
  };
  const shown = open && !moved && state.introDone && state.mode === "explore";

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { ...SPRING.gentle, delay: 0.8 } }}
          exit={{ opacity: 0, y: -8 }}
          className="surface-glass absolute inset-x-2 bottom-2 z-(--layer-map-plates) flex items-center gap-3 rounded-2xl py-1.5 pr-1.5 pl-3 text-small text-moon lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-auto lg:max-w-sm lg:rounded-2xl lg:pl-4"
        >
          <HandTap aria-hidden="true" className="size-5 shrink-0 text-shapla" />
          <span>{t("listen.hint")}</span>
          <Button variant="ghost" tabIndex={-1} onClick={dismiss} className="h-9 shrink-0 rounded-full px-3 text-small hover:bg-tide pointer-coarse:h-11">
            {t("listen.hintDismiss")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
