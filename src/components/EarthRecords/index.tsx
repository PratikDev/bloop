"use client";

import type { ReactNode } from "react";
import { isAppRecord, type AppRecordId } from "@/lib/earth/records";
import { AppTranscriptView } from "./AppTranscript";
import { useFireTranscript } from "./Wildfires/use-fire-transcript";
import { Wildfires } from "./Wildfires";

// The DATA records' players and transcripts, by record id: Official records and the transcript page ask here first
// (one line each), so a new record is added in this file and src/lib/earth/records.ts only.

const PLAYERS: Record<AppRecordId, () => ReactNode> = {
  fires_fwi: () => <Wildfires />,
  landslide_lhasa: () => null,
  nightlights_bm: () => null,
};

/** The record's player, or null when the id isn't a DATA record (Official records plays it as before). */
export function appRecordPlayer(record: string): ReactNode | null {
  return isAppRecord(record) ? PLAYERS[record]() : null;
}

function FireTranscript() {
  const { data, error } = useFireTranscript();
  return <AppTranscriptView data={data} error={error} />;
}

const TRANSCRIPTS: Record<AppRecordId, () => ReactNode> = {
  fires_fwi: () => <FireTranscript />,
  landslide_lhasa: () => null,
  nightlights_bm: () => null,
};

/** The record's transcript, or null when the id isn't a DATA record. */
export function appRecordTranscript(record: string): ReactNode | null {
  return isAppRecord(record) ? TRANSCRIPTS[record]() : null;
}
