"use client";

import { useEffect, useMemo } from "react";
import type { SweepPoint } from "@/lib/audio-adapter/types";
import { valueInFrame, type Sequence } from "@/lib/data";
import { readingFromPoint } from "@/lib/reading";
import { stepSound } from "../AppState/access";
import { liveSoundOn } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { playReading } from "../Commands/use-sound-sync";
import type { TimeLapseFrame } from "./use-time-lapse";

export interface Loaded {
  seq: Sequence;
  path: SweepPoint[];
  images: HTMLImageElement[];
}

export function useHeldFrame(data: Loaded | null): TimeLapseFrame | null {
  const { state } = useAppState();
  const { heldFrame, cursor } = state;
  const held = useMemo<TimeLapseFrame | null>(() => {
    const frame = heldFrame === null || !data ? null : data.seq.frames[heldFrame];
    if (!data || !frame || heldFrame === null) return null;
    const v = valueInFrame(data.seq, frame, cursor.lat, cursor.lon);
    const point = { lat: cursor.lat, lon: cursor.lon, valueC: null, mmPerHour: v.mmPerHour, phase: v.phase };
    return { index: heldFrame, total: data.seq.frames.length, timeUtc: frame.ref.time_utc, point, image: data.images[heldFrame] ?? null, held: true };
  }, [heldFrame, cursor, data]);

  const live = liveSoundOn(state) && stepSound(state) && state.mode === "explore";
  useEffect(() => {
    if (held && live) playReading(readingFromPoint(held.point), held.point.lon);
  }, [held, live]);
  return held;
}
