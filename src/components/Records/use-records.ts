"use client";

import { createContext, useContext } from "react";
import type { JukeboxRecord } from "@/lib/records";

export interface PlayOptions {
  /** Stay on this page (the mini player's previous and next never change page). */
  stay?: boolean;
}

export interface RecordsValue {
  records: readonly JukeboxRecord[];
  /** The record the app is on; null on Home. */
  current: JukeboxRecord | null;
  /** A0 has been played on this device: the "Start here" tag and hint are gone. */
  legendPlayed: boolean;
  play(record: JukeboxRecord, options?: PlayOptions): void;
}

export const RecordsContext = createContext<RecordsValue | null>(null);

export function useRecords(): RecordsValue {
  const value = useContext(RecordsContext);
  if (!value) throw new Error("useRecords must be used inside <RecordsProvider>");
  return value;
}
