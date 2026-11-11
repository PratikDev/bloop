"use client";

import { useEffect, useState } from "react";
import { tableAxes } from "@/a11y/mapNav";
import { loadSequenceFrame, valueInFrame, type LatLon } from "@/lib/data";
import { readAt } from "@/lib/reading";
import type { OceanValue, RainValue } from "@/types/data-contract";
import { useAppState } from "../AppState/use-app-state";
import { useDescribeInput } from "../Describe/use-description";

export type TableRecord = "ocean" | "rain";

export interface ValueTableData {
  record: TableRecord;
  timeUtc: string;
  lats: number[];
  lons: number[];
  /** values[row][col], read exactly as the sound reads the needle (readAt, or the held frame's own grid). */
  values: (OceanValue | RainValue)[][];
}

type Reader = { timeUtc: string; read(at: LatLon): OceanValue | RainValue };

/**
 * The values around the needle for each record on screen: the live frames (the same readAt the sound and the readout
 * use), or a time-lapse frame held with PageUp/PageDown (its own grid, as its sound plays it). Null while loading.
 */
export function useTableValues(): ValueTableData[] | null {
  const { state } = useAppState();
  const input = useDescribeInput();
  const [held, setHeld] = useState<{ index: number; reader: Reader } | null>(null);
  const heldFrame = input?.heldFrame ?? null;

  useEffect(() => {
    if (heldFrame === null) return;
    let cancelled = false;
    void loadSequenceFrame(heldFrame).then((loaded) => {
      if (cancelled || !loaded) return;
      const size = { width: loaded.index.grid.width, height: loaded.index.grid.height };
      const reader: Reader = {
        timeUtc: loaded.frame.ref.time_utc,
        read: (at) => ({ track: "rain", ...valueInFrame({ size }, loaded.frame, at.lat, at.lon) }),
      };
      setHeld({ index: heldFrame, reader });
    });
    return () => {
      cancelled = true;
    };
  }, [heldFrame]);

  if (!input) return null;
  const { fields, at, track } = input;
  const readers: { record: TableRecord; reader: Reader }[] = [];
  if (heldFrame !== null) {
    if (held?.index !== heldFrame) return null;
    readers.push({ record: "rain", reader: held.reader });
  } else {
    if (track !== "rain") readers.push({ record: "ocean", reader: { timeUtc: fields.sst.meta.frame_time_utc, read: (p) => readAt(fields, p).ocean } });
    if (track !== "ocean" && fields.rain) readers.push({ record: "rain", reader: { timeUtc: fields.rain.meta.frame_time_utc, read: (p) => readAt(fields, p).rain } });
  }
  const { lats, lons } = tableAxes(at, state.stepDeg);
  return readers.map(({ record, reader }) => ({
    record,
    timeUtc: reader.timeUtc,
    lats,
    lons,
    values: lats.map((lat) => lons.map((lon) => reader.read({ lat, lon }))),
  }));
}
