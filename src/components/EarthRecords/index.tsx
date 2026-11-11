"use client";

import type { ReactNode } from "react";
import { isAppRecord, type AppRecordId } from "@/lib/earth/records";
import { AppTranscriptView } from "./AppTranscript";
import { useFireTranscript } from "./Wildfires/use-fire-transcript";
import { Wildfires } from "./Wildfires";
import { Landslides } from "./Landslides";
import { useSlideTranscript } from "./Landslides/use-slide-transcript";
import { NightLights } from "./NightLights";
import { useLightsTranscript } from "./NightLights/use-lights-transcript";
import { LightsLink } from "./NightLights/LightsLink";
import { RADAR_RECORD, RadarMethod } from "./Radar";
import { useRadarTranscript } from "./Radar/use-radar-transcript";

// The DATA records' players and transcripts, by record id: Official records and the transcript page ask here first
// (one line each), so a new record is added in this file and src/lib/earth/records.ts only.

const PLAYERS: Record<AppRecordId, () => ReactNode> = {
  fires_fwi: () => <Wildfires />,
  landslide_lhasa: () => <Landslides />,
  nightlights_bm: () => <NightLights />,
};

/** The record's player, or null when the id isn't a DATA record (Official records plays it as before). */
export function appRecordPlayer(record: string): ReactNode | null {
  if (record === RADAR_RECORD) return <RadarMethod />;
  return isAppRecord(record) ? PLAYERS[record]() : null;
}

function RadarTranscript() {
  const { data, error } = useRadarTranscript();
  return <AppTranscriptView data={data} error={error} />;
}

function LightsTranscript() {
  const { data, error } = useLightsTranscript();
  return <AppTranscriptView data={data} error={error} />;
}

function SlideTranscript() {
  const { data, error } = useSlideTranscript();
  return <AppTranscriptView data={data} error={error} />;
}

function FireTranscript() {
  const { data, error } = useFireTranscript();
  return <AppTranscriptView data={data} error={error} />;
}

const TRANSCRIPTS: Record<AppRecordId, () => ReactNode> = {
  fires_fwi: () => <FireTranscript />,
  landslide_lhasa: () => <SlideTranscript />,
  nightlights_bm: () => <LightsTranscript />,
};

/** The record's transcript, or null when the id isn't a DATA record. */
export function appRecordTranscript(record: string): ReactNode | null {
  if (record === RADAR_RECORD) return <RadarTranscript />;
  return isAppRecord(record) ? TRANSCRIPTS[record]() : null;
}

/** Extras shown under a pipeline record by the DATA pieces: the 5313 night-lights record links to the measured
 *  radiance. `choose` picks a record on the shelf. */
export function appRecordExtras(record: string, choose: (record: string) => void): ReactNode | null {
  return record === "lights_5313" ? <LightsLink choose={choose} /> : null;
}
