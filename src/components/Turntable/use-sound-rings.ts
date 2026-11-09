"use client";

import { useEffect, useRef, type RefObject } from "react";
import { clockNow, eventClockTime } from "@/lib/audio-adapter";
import { onAnyAudioEvent } from "@/lib/audio-engines";
import { readAt } from "@/lib/reading";
import { needleSoundWord } from "@/lib/sound-words";
import { isVoiceAudible } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import type { TurntableScene } from "./scene";

/** One ring at the needle for each sound that plays there, from the same events as the sound words, when it sounds. */
export function useSoundRings(sceneRef: RefObject<TurntableScene | null>): void {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const latest = useRef({ state, fields });
  useEffect(() => {
    latest.current = { state, fields };
  }, [state, fields]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const off = onAnyAudioEvent((e) => {
      const { state: now, fields: live } = latest.current;
      if (!live || now.reduceMotion) return;
      const { ocean, rain } = readAt(live, now.cursor);
      const reading = { lon: now.cursor.lon, oceanC: ocean.valueC, rainMm: rain.mmPerHour, phase: rain.phase };
      if (!needleSoundWord(e, reading, (voice) => isVoiceAudible(now, voice))) return;
      const wait = e.kind === "drop" ? Math.max(0, (eventClockTime(e) - clockNow()) * 1000) : 0;
      const timer = setTimeout(() => {
        timers.delete(timer);
        sceneRef.current?.effects.ring();
      }, wait);
      timers.add(timer);
    });
    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, [sceneRef]);
}
