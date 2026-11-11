"use client";

import type { OfficialRecordState } from "../OfficialRecords/use-official-record";
import { recordPlan } from "@/lib/art/proof/sources";
import { recordCategory } from "@/lib/art/live/record";
import { orchestraOn } from "@/lib/art/settings";
import { useArtSettings } from "@/hooks/use-art-settings";
import { FLAGS } from "@/lib/flags";
import { ArtDial } from "./Dial";
import { DataChoice } from "./DataChoice";
import { DialCheck } from "./Dial/DialCheck";
import { monthOf, usePlayContext } from "./use-play-context";

export function ArtRecord({ rec, record, time }: { rec: OfficialRecordState; record: string; time: string | undefined }) {
  const [art] = useArtSettings();
  usePlayContext(rec.option ? { recordId: record, playMode: rec.option.channels.length > 1 ? "both" : "single", month: monthOf(time) } : null);
  const choices = rec.option?.channels.map((c) => <DataChoice key={c.voice} voiceId={c.voice} />);
  if (!FLAGS.artDial) return <>{choices}</>;
  const voice = rec.option?.channels[0]?.voice;
  const category = voice ? recordCategory(voice) : null;
  return (
    <ArtDial className="surface-plate rounded-plate p-3">
      {choices}
      <DialCheck ready={rec.ready} plan={async () => recordPlan(rec)} timbre={orchestraOn(art) && category ? category : "plain"} />
    </ArtDial>
  );
}
