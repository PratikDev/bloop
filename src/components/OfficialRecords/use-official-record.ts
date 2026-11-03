"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import {
  clampLat,
  loadOfficialLayer,
  loadOfficialManifest,
  loadOfficialValidation,
  officialValueAt,
  wrapLon,
  type LatLon,
  type OfficialGrid,
  type OfficialReading,
} from "@/lib/data";
import type { OfficialManifest, OfficialPlayOption, OfficialValidationFile } from "@/types/data-contract";

export interface ChannelReading {
  voice: string;
  reading: OfficialReading | null;
}

export interface OfficialRecordState {
  manifest: OfficialManifest | null;
  validation: OfficialValidationFile | null;
  error: boolean;
  option: OfficialPlayOption | null;
  setOption(id: string): void;
  grids: Record<string, OfficialGrid>; // the current option's layers, once loaded
  ready: boolean;
  step: number;
  setStep(step: number): void;
  steps: number;
  playing: boolean;
  setPlaying(on: boolean): void;
  /** Sound at the needle without time running (the Braille Data Explorer: the caret is the needle). */
  listening: boolean;
  setListening(on: boolean): void;
  needle: LatLon;
  moveNeedle(to: LatLon): void;
  readings: ChannelReading[];
}

/** The reading a channel plays: one layer's value, or the magnitude of two (u, v); null where any part has no data. */
export function channelReading(grids: Record<string, OfficialGrid>, layers: string[], combine: "value" | "magnitude", step: number, at: LatLon) {
  const parts = layers.map((id) => (grids[id] ? officialValueAt(grids[id], step, at.lat, at.lon) : null));
  if (parts.some((p) => p === null)) return null;
  const values = parts as OfficialReading[];
  if (combine === "value") return values[0];
  return { value: Math.hypot(...values.map((p) => p.value)), below: false };
}

/** One official record: its manifest, the chosen play option's layers, time, needle and the voices it drives. */
export function useOfficialRecord(record: string, soundOn: boolean): OfficialRecordState {
  const [manifest, setManifest] = useState<OfficialManifest | null>(null);
  const [validation, setValidation] = useState<OfficialValidationFile | null>(null);
  const [error, setError] = useState(false);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, OfficialGrid>>({});
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [listening, setListening] = useState(false);
  const [needle, setNeedle] = useState<LatLon | null>(null);

  // The caller keys the player by record, so a new record starts from fresh state.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadOfficialManifest(record), loadOfficialValidation(record).catch(() => null)])
      .then(([m, v]) => {
        if (cancelled) return;
        setManifest(m);
        setValidation(v);
        setOptionId(m.play[0]?.id ?? null);
        setNeedle(m.play[0]?.start ?? null);
        setStep(0);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [record]);

  const option = manifest?.play.find((o) => o.id === optionId) ?? null;
  const layerIds = useMemo(() => (option ? [...new Set([option.map, ...option.channels.flatMap((c) => c.layers)])] : []), [option]);

  useEffect(() => {
    if (!manifest) return;
    let cancelled = false;
    for (const id of layerIds) {
      if (cache[id]) continue;
      const layer = manifest.layers.find((l) => l.id === id);
      if (!layer) continue;
      loadOfficialLayer(manifest.record, layer)
        .then((g) => !cancelled && setCache((c) => ({ ...c, [id]: g })))
        .catch(() => !cancelled && setError(true));
    }
    return () => {
      cancelled = true;
    };
  }, [manifest, layerIds, cache]);

  const ready = layerIds.length > 0 && layerIds.every((id) => cache[id]);
  const steps = option && cache[option.map] ? cache[option.map].steps.length : 0;
  const at = useMemo(() => needle ?? { lat: 0, lon: 0 }, [needle]);

  useEffect(() => {
    if (!playing || !option || steps === 0) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % steps), 1000 / option.steps_per_second);
    return () => clearInterval(timer);
  }, [playing, option, steps]);

  const readings = useMemo<ChannelReading[]>(
    () => (option && ready ? option.channels.map((c) => ({ voice: c.voice, reading: channelReading(cache, c.layers, c.combine, step, at) })) : []),
    [option, ready, cache, step, at],
  );

  // Sound follows the readings while playing (or listening); a below-range reading plays at its bound (the rule's bottom), no data is silence.
  const sounding = (playing || listening) && soundOn;
  useEffect(() => {
    for (const r of readings) audio.setRecordVoice(r.voice, sounding ? (r.reading?.value ?? null) : null, at.lon);
  }, [readings, sounding, at.lon]);
  useEffect(() => () => audio.silenceRecord(), [record]);

  const setOption = useCallback(
    (id: string) => {
      audio.silenceRecord();
      setOptionId(id);
      setStep(0);
    },
    [],
  );
  const moveNeedle = useCallback((to: LatLon) => setNeedle({ lat: clampLat(to.lat), lon: wrapLon(to.lon) }), []);

  return { manifest, validation, error, option, setOption, grids: cache, ready, step, setStep, steps, playing, setPlaying, listening, setListening, needle: at, moveNeedle, readings };
}
