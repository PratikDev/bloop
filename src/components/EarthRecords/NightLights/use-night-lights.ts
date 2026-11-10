"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { voiceSpec } from "@/lib/audio/mapping";
import { LIGHTS_VOICE, lightsSteps, loadNightLights } from "@/lib/earth/nightlights";
import { dataVoice } from "@/lib/earth/sound/orchestra-hook";
import { dataOut, report } from "@/lib/earth/sound/out";
import { useRecordPlay } from "../use-record-play";

/** One night per this long (a design choice); the note sounds for NOTE_SHARE of it. */
const STEP_MS = 650;
const NOTE_SHARE = 0.7;

/** The city to open on: set by the 5313 record's "hear measured radiance" link, else the file's first. */
let preferred: string | null = null;
export const preferCity = (city: string) => {
  preferred = city;
};

/** The night-lights record (P4): the file, the chosen city, and its nights played as a short sequence with a playhead. */
export function useNightLights() {
  const { value: file, error } = useLoaded(loadNightLights);
  const [chosen, setCity] = useState<string | null>(() => preferred);
  const [step, setStep] = useState(-1);
  const stopSound = useCallback(() => report("lights", { radiance: null, hz: null, step: -1 }), []);
  const play = useRecordPlay(stopSound);
  const cities = useMemo(() => (file ? Object.keys(file.cities) : []), [file]);
  const city = chosen && cities.includes(chosen) ? chosen : (cities[0] ?? null);
  const steps = useMemo(() => (file && city ? lightsSteps(file.cities[city]) : []), [file, city]);
  const lon = file && city ? file.cities[city].lon : 0;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // The playhead: one night per STEP_MS while playing; it stops at the last night.
  useEffect(() => {
    if (!play.playing) return;
    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        play.stop();
        return;
      }
      const s = steps[i];
      setStep(i);
      const out = dataOut();
      if (out && s.hz !== null) {
        const gain = voiceSpec(LIGHTS_VOICE).sound.maxGain;
        // HOOK: orchestra (people): each night's note goes through the People and carbon family.
        dataVoice("people").note(out.graph.ctx, out.bus, { hz: s.hz, when: out.graph.ctx.currentTime, duration: (STEP_MS / 1000) * NOTE_SHARE, gain });
      }
      // A gap: a rest (no note at all), said on screen as "gap: cloud".
      report("lights", { radiance: s.radiance, hz: s.hz, step: i });
      i += 1;
    };
    const first = setTimeout(tick, 0);
    timer.current = setInterval(tick, STEP_MS);
    return () => {
      clearTimeout(first);
      if (timer.current) clearInterval(timer.current);
    };
    // Restart only when playing starts or the city changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play.playing, steps]);

  const choose = useCallback(
    (c: string) => {
      play.stop();
      setStep(-1);
      setCity(c);
    },
    [play],
  );
  return { file, error, cities, city, choose, steps, step: play.playing ? step : -1, lastStep: step, lon, ...play };
}
