"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatRainRate, formatTemperature, formatUtc, type MessageKey } from "@/lib/i18n";
import { soundChip } from "@/lib/sound-captions";
import { nowPlaying, type NowPlaying } from "@/lib/timed-text/live";
import { UNIT } from "@/lib/timed-text/tracks";
import { onCaption } from "@/lib/ui-captions";
import { useAppState, useT } from "../AppState/use-app-state";

const noNow = () => null;

/**
 * The sound caption beside the caption bar: while the sweep or the time-lapse plays, its
 * "now playing" line from the metadata track; otherwise a short note on what the last sound did ("rain thickening ↑").
 */
export function useSoundCaption(): string | null {
  const { state } = useAppState();
  const t = useT();
  const now: NowPlaying | null = useSyncExternalStore(nowPlaying.subscribe, nowPlaying.get, noNow);
  const [chip, setChip] = useState<MessageKey | null>(null);
  const lastValue = useRef(new Map<string, number>());
  useEffect(() => onCaption((e) => setChip(soundChip(e, lastValue.current))), []);

  const d = now?.[state.lang];
  if (d) {
    const value =
      d.value === null
        ? d.note
        : d.unit === UNIT.ocean
          ? t("tt.value.temp", { value: formatTemperature(d.value, state.lang) })
          : t("tt.value.rain", { value: formatRainRate(d.value, state.lang) });
    return d.time ? t("tt.nowPlayingAt", { place: d.place, value, time: formatUtc(d.time, state.lang) }) : t("tt.nowPlaying", { place: d.place, value });
  }
  return chip && t(chip);
}
