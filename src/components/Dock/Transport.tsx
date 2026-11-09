"use client";

import { SkipBack, SkipForward } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { neighbour } from "@/lib/records";
import { useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { SoundButton } from "./SoundButton";

const STEP_KEY =
  "key size-11 rounded-full bg-paper text-moon hover:bg-paper disabled:border-navy-soft disabled:text-navy-soft disabled:opacity-100 disabled:shadow-none [&_svg]:size-5";

/**
 * Previous, Play/Pause, Next. Previous and next walk the current record's group only, stop at its ends,
 * and never change page. `onTrack` lets the Turntable play its own record change.
 */
export function Transport({ onTrack }: { onTrack?: (track: TrackMode) => void }) {
  const { records, current, play } = useRecords();
  const t = useT();
  const before = current && neighbour(records, current, -1);
  const after = current && neighbour(records, current, 1);
  const go = (record: NonNullable<typeof before>) => {
    if (record.action.kind === "track" && onTrack) onTrack(record.action.track);
    else play(record, { stay: true });
  };
  return (
    <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
      <Button variant="ghost" aria-label={t("player.previous")} disabled={!before} onClick={() => before && go(before)} className={STEP_KEY}>
        <SkipBack aria-hidden="true" weight="fill" />
      </Button>
      <SoundButton />
      <Button variant="ghost" aria-label={t("player.next")} disabled={!after} onClick={() => after && go(after)} className={STEP_KEY}>
        <SkipForward aria-hidden="true" weight="fill" />
      </Button>
    </div>
  );
}
