"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { voiceSpec } from "@/lib/audio/mapping";
import { LIGHTS_VOICE, lightsSteps, loadNightLights } from "@/lib/earth/nightlights";
import { APP_RECORDS } from "@/lib/earth/records";
import { dataVoice } from "@/lib/earth/sound/orchestra-hook";
import { dataOut, report } from "@/lib/earth/sound/out";
import { useRecordPlay } from "../use-record-play";

const STEP_MS = 650;
const NOTE_SHARE = 0.7;

let preferred: string | null = null;
export const preferCity = (city: string) => {
  preferred = city;
};

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
        dataVoice(APP_RECORDS.nightlights_bm.id).note(out.graph.ctx, out.bus, { hz: s.hz, when: out.graph.ctx.currentTime, duration: (STEP_MS / 1000) * NOTE_SHARE, gain });
      }
      report("lights", { radiance: s.radiance, hz: s.hz, step: i });
      i += 1;
    };
    const first = setTimeout(tick, 0);
    timer.current = setInterval(tick, STEP_MS);
    return () => {
      clearTimeout(first);
      if (timer.current) clearInterval(timer.current);
    };
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
