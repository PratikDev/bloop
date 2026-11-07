"use client";

import { frameGap, gapLong } from "@/lib/frame-gap";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "./AppState/use-app-state";
import { useLiveData } from "./LiveData/use-live-data";
import { HowWeGotThis } from "./HowWeGotThis";
import { useLiveProvenance } from "@/hooks/use-live-provenance";

/**
 * Both mode (mentor item 1): the ocean and rain frames' own times and how far apart they are, from the two
 * manifests. The caller shows it only where both play together.
 */
export function FrameGapNote({ className, explained = false }: { className?: string; explained?: boolean }) {
  const { state } = useAppState();
  const t = useT();
  const { sst, rain } = useLiveData();
  const gap = sst && rain ? frameGap(sst.meta.frame_time_utc, rain.meta.frame_time_utc) : null;
  const facts = useLiveProvenance("both", null).slice(-1);
  if (!gap) return null;
  const note = (
    <p data-testid="frame-gap" data-gap-ms={gap.ms} className={cn("text-small text-moon", !explained && className)}>
      <span className="sr-only">{t("frameGap.label")}: </span>
      {gapLong(t, state.lang, gap)}
    </p>
  );
  // Shown on its own (Listen's header): its own "How we got this" (mentor item 11). Inside a frame label, the label's.
  return explained ? (
    <div data-provenance-group="" className={cn("flex flex-wrap items-center gap-2", className)}>
      {note}
      <HowWeGotThis facts={facts} />
    </div>
  ) : (
    note
  );
}
