"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureAudioAll } from "@/lib/audio-engines";
import { useAppState, useT } from "../../AppState/use-app-state";
import { LetterCard } from "./LetterCard";
import { useListenLetter } from "./use-listen-letter";

/** Listen's "Leave a letter" button and the letter for the needle's place. */
export function ListenLetter() {
  const { state } = useAppState();
  const t = useT();
  const built = useListenLetter();
  const [open, setOpen] = useState(false);
  const leave = async () => {
    if (state.soundOn) await ensureAudioAll().catch(() => undefined);
    setOpen(true);
  };
  return (
    <div className="space-y-2">
      {!open && (
        <Button variant="outline" className="h-11" disabled={!built} onClick={() => void leave()}>
          {t("letter.leave")}
        </Button>
      )}
      {open && built && <LetterCard letter={built.letter} lon={state.cursor.lon} onClose={() => setOpen(false)} />}
    </div>
  );
}
