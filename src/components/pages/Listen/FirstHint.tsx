"use client";

import { useEffect, useState } from "react";
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
 * First-visit hints, in the records list and never on the map: how to move around (gone with the first move) and
 * where to start (gone once A0 has played). Screen readers get the first from the map's own instructions.
 */
export function FirstHint() {
  const { state } = useAppState();
  const { legendPlayed } = useRecords();
  const t = useT();
  const [open] = useState(() => !seen());
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
    <p className="text-small text-haze">{[moveHint && t("listen.hint"), !legendPlayed && t("records.hint.legend")].filter(Boolean).join(" ")}</p>
  );
}
