"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useRecords } from "../../Records/use-records";

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
 * First-visit hints, under the map and never on it: how to move around (gone with "Got it" or the first move) and
 * where to start (gone once A0 has played). Screen readers get the first from the map's own instructions.
 */
export function FirstHint() {
  const { state } = useAppState();
  const { legendPlayed } = useRecords();
  const t = useT();
  const [open, setOpen] = useState(() => !seen());
  // Where the cursor was when the page opened: any move after that counts as "got it".
  const [start] = useState(state.cursor);
  const moved = state.cursor !== start;

  useEffect(() => {
    if (open && moved) remember();
  }, [open, moved]);

  if (!state.introDone || state.mode !== "explore") return null;
  const moveHint = open && !moved;
  if (!moveHint && legendPlayed) return null;
  return (
    <p className="flex min-w-0 flex-[1_1_16rem] items-center gap-2 text-small text-haze">
      <span>{[moveHint && t("listen.hint"), !legendPlayed && t("records.hint.legend")].filter(Boolean).join(" ")}</span>
      {moveHint && (
        <Button
          variant="ghost"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => {
            remember();
            setOpen(false);
          }}
          className="h-9 shrink-0 rounded-full px-3 text-small hover:bg-tide pointer-coarse:h-11"
        >
          {t("listen.hintDismiss")}
        </Button>
      )}
    </p>
  );
}
