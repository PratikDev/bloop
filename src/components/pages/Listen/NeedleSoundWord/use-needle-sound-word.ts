"use client";

import { useEffect, useRef, useState } from "react";
import { clockNow, eventClockTime } from "@/lib/audio-adapter";
import { onAnyAudioEvent } from "@/lib/audio-engines";
import type { LatLon, LiveFields } from "@/lib/data";
import { readAt } from "@/lib/reading";
import { createSoundWordPacer, needleSoundWord, SOUND_WORD_GAP_MS, SOUND_WORD_GAP_REDUCED_MS, SOUND_WORD_SHOW_MS, SOUND_WORDS, type NeedleReading, type SoundWordId } from "@/lib/sound-words";
import { isVoiceAudible } from "../../../AppState/reducer";
import { useAppState } from "../../../AppState/use-app-state";
import { useLiveData } from "../../../LiveData/use-live-data";

export interface NeedleWord {
  key: number;
  id: SoundWordId;
  at: LatLon;
}

function needleReading(fields: LiveFields, cursor: LatLon): NeedleReading {
  const { ocean, rain } = readAt(fields, cursor);
  return { lon: cursor.lon, oceanC: ocean.valueC, rainMm: rain.mmPerHour, phase: rain.phase };
}

/**
 * The word for the sound playing at the needle, at the moment it plays. Engine events arrive up to the scheduler's
 * look-ahead early, so a word waits for its event's audio-clock time, and is dropped if the voice went quiet meanwhile.
 */
export function useNeedleSoundWord(): NeedleWord | null {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const [word, setWord] = useState<NeedleWord | null>(null);
  const latest = useRef({ state, fields });
  useEffect(() => {
    latest.current = { state, fields };
  }, [state, fields]);

  useEffect(() => {
    const pacer = createSoundWordPacer();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (ms: number, run: () => void) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        run();
      }, ms);
      timers.add(timer);
    };
    let shown = 0;

    const off = onAnyAudioEvent((e) => {
      const { state: now, fields: live } = latest.current;
      if (!now.soundWords || !live) return;
      const id = needleSoundWord(e, needleReading(live, now.cursor), (voice) => isVoiceAudible(now, voice));
      if (!id) return;
      const at = e.kind === "drop" ? eventClockTime(e) : clockNow();
      if (!pacer.allow(at * 1000, now.reduceMotion ? SOUND_WORD_GAP_REDUCED_MS : SOUND_WORD_GAP_MS)) return;
      later(Math.max(0, (at - clockNow()) * 1000), () => {
        const { state: then } = latest.current;
        if (!then.soundWords || !isVoiceAudible(then, SOUND_WORDS[id].voice)) return;
        setWord({ key: ++shown, id, at: then.cursor });
        later(SOUND_WORD_SHOW_MS, () => setWord(null));
      });
    });

    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, []);

  return word;
}
