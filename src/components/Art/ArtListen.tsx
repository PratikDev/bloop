"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureAudioAll } from "@/lib/audio-engines";
import { FLAGS } from "@/lib/flags";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { JourneyPanel } from "./Journey";
import { LetterCard } from "./Letter/LetterCard";
import { useListenLetter } from "./Letter/use-listen-letter";
import { monthOf, usePlayContext } from "./use-play-context";

/** Whether Listen shows ART's row of buttons (the page keeps a row free for it under the map). */
export const ART_ROW = FLAGS.artLetter || FLAGS.artJourney;

/**
 * Listen's part in ART: the live record the dial describes (ocean, or rain when only rain plays; Both = two data
 * voices, so no chord or drone), and a row under the map with "Leave a letter" and "Water's journey". `onOpenChange`
 * tells the page a panel is open (the page then scrolls, as it does for the braille explorer).
 */
export function ArtListen({ className, onOpenChange }: { className?: string; onOpenChange?: (open: boolean) => void }) {
  const { state } = useAppState();
  const t = useT();
  const { sst } = useLiveData();
  const letter = useListenLetter();
  const [open, setOpen] = useState<"letter" | "journey" | null>(null);
  usePlayContext({
    recordId: state.track === "rain" ? "rain" : "ocean",
    playMode: state.track === "both" ? "both" : "single",
    month: monthOf(sst?.meta.frame_time_utc),
  });
  useEffect(() => onOpenChange?.(open !== null), [open, onOpenChange]);
  if (!ART_ROW || state.mode === "story") return null;
  const leave = async () => {
    if (state.soundOn) await ensureAudioAll().catch(() => undefined);
    setOpen("letter");
  };
  return (
    <div className={className} data-testid="art-listen">
      <div className="flex flex-wrap items-start gap-2">
        {FLAGS.artLetter && (
          <Button variant="outline" className="h-11" disabled={!letter} aria-expanded={open === "letter"} onClick={() => void leave()}>
            {t("letter.leave")}
          </Button>
        )}
        {FLAGS.artJourney && (
          <Button variant="outline" className="h-11" aria-expanded={open === "journey"} onClick={() => setOpen("journey")}>
            {t("journey.open")}
          </Button>
        )}
      </div>
      {open === "letter" && letter && <LetterCard key={`${state.cursor.lat},${state.cursor.lon}`} letter={letter.letter} lon={state.cursor.lon} onClose={() => setOpen(null)} />}
      {open === "journey" && <JourneyPanel onClose={() => setOpen(null)} />}
    </div>
  );
}
