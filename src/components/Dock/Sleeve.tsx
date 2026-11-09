"use client";

import { useRef, type CSSProperties } from "react";
import { useSpin } from "@/hooks/use-spin";
import { DATA_PATHS } from "@/lib/data";
import { useAppState, useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { PlayerSheet } from "../Player";
import { VinylMark } from "../VinylMark";

/** Today's ocean frame on a sleeve, centred on the needle's longitude, with the record peeking out; then the title and source. */
export function Sleeve() {
  const { state } = useAppState();
  const { current } = useRecords();
  const t = useT();
  const disc = useRef<SVGSVGElement>(null);
  useSpin(disc, state.soundOn && state.playing);
  if (!current) return null;
  const art: CSSProperties = {
    backgroundImage: `url(${DATA_PATHS.sstImage})`,
    backgroundSize: "cover",
    backgroundPosition: `${((state.cursor.lon + 180) / 360) * 100}% 50%`,
  };
  return (
    <PlayerSheet
      trigger={<button type="button" aria-label={t("player.open", { record: `${current.code} ${current.title(t)}` })} className="hidden min-w-0 flex-[0_1_18rem] items-center gap-3 rounded-md text-left md:flex" />}
    >
      <div aria-hidden="true" className="relative mr-4 size-15.5 shrink-0">
        <VinylMark ref={disc} className="absolute top-1 -right-4 size-13.5" />
        <div style={art} className="absolute inset-0 rounded-md border-2 border-navy bg-paper" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-strip text-strip">
          <span translate="no">{current.code}</span> {current.title(t)}
        </p>
        <p className="truncate text-small text-haze">{t(`records.source.${current.group}`)}</p>
      </div>
    </PlayerSheet>
  );
}
