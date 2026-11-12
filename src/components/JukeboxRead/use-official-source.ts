"use client";

import { useMemo } from "react";
import { officialSource, type ReadSource } from "@/lib/cv/read-source";
import type { OfficialRecordState } from "../OfficialRecords/use-official-record";

/** The layer an official record's first voice plays (a single-layer value; a u/v magnitude has no one frame to read). */
export function useOfficialSource(rec: OfficialRecordState): ReadSource | null {
  const channel = rec.option?.channels[0];
  const grid = channel && channel.combine === "value" ? rec.grids[channel.layers[0]] : undefined;
  const record = rec.manifest?.record;
  return useMemo(() => (grid && channel && record ? officialSource(record, grid, rec.step, channel.voice) : null), [grid, channel, record, rec.step]);
}
