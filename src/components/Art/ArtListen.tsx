"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { JourneyPanel } from "./Journey";
import { ListenLetter } from "./Letter/ListenLetter";
import { monthOf, usePlayContext } from "./use-play-context";

/** Listen's part in ART: the live record the dial describes (ocean, or rain when only rain plays; Both = two data
 *  voices, so no chord or drone), "Leave a letter" and "Water's journey". */
export function ArtListen() {
  const { state } = useAppState();
  const t = useT();
  const { sst } = useLiveData();
  const [journey, setJourney] = useState(false);
  usePlayContext({
    recordId: state.track === "rain" ? "rain" : "ocean",
    playMode: state.track === "both" ? "both" : "single",
    month: monthOf(sst?.meta.frame_time_utc),
  });
  if ((!FLAGS.artLetter && !FLAGS.artJourney) || state.mode === "story") return null;
  return (
    <div className="shrink-0 space-y-3 px-4 pb-3 fit:px-1" data-testid="art-listen">
      <div className="flex flex-wrap items-start gap-2">
        {FLAGS.artLetter && <ListenLetter />}
        {FLAGS.artJourney && !journey && (
          <Button variant="outline" className="h-11" onClick={() => setJourney(true)}>
            {t("journey.open")}
          </Button>
        )}
      </div>
      {journey && <JourneyPanel onClose={() => setJourney(false)} />}
    </div>
  );
}
