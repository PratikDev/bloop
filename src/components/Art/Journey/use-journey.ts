"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildJourney, stepAt, type Journey, type JourneyStepId } from "@/lib/art/journey/plan";
import { renderJourney, renderJourneyOffline } from "@/lib/art/journey/render";
import { journeySources } from "@/lib/art/journey/sources";
import { encodeWav, fingerprint } from "@/lib/art/wav";
import { getCtx, getGraph } from "@/lib/audio/context";
import { track } from "@/lib/audio/sources";
import { onStopAll } from "@/lib/audio/stop";
import { stopAllEngines } from "@/lib/audio-engines";
import { useSoundStart } from "@/hooks/use-sound-start";
import { downloadBlob } from "@/lib/download";
import { useLiveData } from "../../LiveData/use-live-data";

const LEAD_SEC = 0.15;

export function useJourney(onStep: (id: JourneyStepId, j: Journey) => void, onEnd: () => void) {
  const { fields } = useLiveData();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [step, setStep] = useState<JourneyStepId | null>(null);
  const [playing, setPlaying] = useState(false);
  const [wav, setWav] = useState<{ seconds: number; id: string } | null>(null);
  const [rendering, setRendering] = useState(false);
  const frame = useRef(0);
  const soundStart = useSoundStart();

  useEffect(() => {
    if (!fields || journey) return;
    let cancelled = false;
    void journeySources(fields).then((s) => !cancelled && setJourney(buildJourney(s)));
    return () => {
      cancelled = true;
    };
  }, [fields, journey]);

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setPlaying(false);
    stopAllEngines();
  }, []);

  const play = useCallback(async () => {
    if (!journey) return;
    await soundStart();
    const ctx = getCtx();
    const out = new GainNode(ctx, { gain: 1 });
    out.connect(getGraph().sonification);
    const off = onStopAll(() => {
      out.disconnect();
      off();
    });
    const t0 = ctx.currentTime + LEAD_SEC;
    renderJourney(ctx, out, journey, t0, track);
    setPlaying(true);
    let last: JourneyStepId | null = null;
    const tick = () => {
      const t = ctx.currentTime - t0;
      const s = stepAt(journey, t);
      if (s && s.id !== last) {
        last = s.id;
        setStep(s.id);
        onStep(s.id, journey);
      }
      if (t >= journey.seconds) {
        setPlaying(false);
        onEnd();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [journey, onStep, onEnd, soundStart]);

  const saveWav = useCallback(async () => {
    if (!journey) return;
    setRendering(true);
    try {
      const buffer = await renderJourneyOffline(journey);
      const bytes = encodeWav([buffer.getChannelData(0), buffer.getChannelData(1)], buffer.sampleRate);
      setWav({ seconds: Math.round(buffer.duration), id: fingerprint(bytes) });
      downloadBlob(new Blob([bytes.slice().buffer], { type: "audio/wav" }), "bloop-waters-journey.wav");
    } finally {
      setRendering(false);
    }
  }, [journey]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return { journey, step, playing, play, stop, saveWav, wav, rendering };
}
