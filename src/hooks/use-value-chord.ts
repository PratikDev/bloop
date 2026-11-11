"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAnnounce } from "@/components/Announcer/use-announcer";
import { useAppState, useT } from "@/components/AppState/use-app-state";
import { valueChord } from "@/lib/audio/layers/chord";
import type { ChordGate, ChordTone, PlayMode } from "@/lib/audio/layers/types";
import { onAnyAudioEvent } from "@/lib/audio-engines";
import type { BoxStats } from "@/lib/cv/box-stats";
import { chordShort, chordText } from "@/lib/cv/chord-text";
import type { LiveBudget } from "@/lib/cv/error-budget";
import type { ReadSource } from "@/lib/cv/read-source";
import { FLAGS } from "@/lib/flags";
import { dialOwnsChord } from "@/lib/art/chord-hook";
import { dialStop } from "@/lib/art/settings";
import { useArtSettings } from "./use-art-settings";
import { useCvView } from "./use-cv-view";
import { useShortLines } from "./use-short-lines";

const DUET_TAIL_MS = 2000;
const NO_VALUES = new Float64Array(0);

export interface ValueChordState {
  gate: ChordGate;
  tones: readonly ChordTone[];
  text: string;
  short: string;
  sigma: number | null;
}

const chordSigma = (budget: LiveBudget | null) => (budget && !budget.axis.log ? budget.axis.error_in_axis_units : null);

export function useValueChord(source: ReadSource | null, stats: BoxStats | null, budget: LiveBudget | null, playMode: PlayMode): ValueChordState {
  const t = useT();
  const { state } = useAppState();
  const announce = useAnnounce();
  const shortLines = useShortLines();
  const [view] = useCvView();
  const [duet, setDuet] = useState(false);
  const tones = useSyncExternalStore(valueChord.subscribe, valueChord.sounding, valueChord.sounding);
  const sigma = chordSigma(budget);
  const mode: PlayMode = duet ? "duet" : playMode;
  const req = source ? { recordId: source.recordId, playMode: mode } : null;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onAnyAudioEvent((e) => {
      if (e.kind !== "step" || e.player !== "unison") return;
      setDuet(true);
      clearTimeout(timer);
      if (e.index === e.total - 1) timer = setTimeout(() => setDuet(false), DUET_TAIL_MS);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!FLAGS.cvChord) return;
    valueChord.setView(source ? { recordId: source.recordId, trust: source.trust, pitchVoice: source.pitchVoice, sigma, values: stats?.values ?? NO_VALUES } : null);
  }, [source, stats, sigma]);

  const [art] = useArtSettings();
  const dialOwns = dialOwnsChord();
  const on = FLAGS.cvChord && view.chord && state.playing && state.soundOn && !dialOwns;
  const recordId = req?.recordId;
  useEffect(() => {
    if (on && recordId) valueChord.enable({ recordId, playMode: mode }, "user");
    else valueChord.disable("user");
  }, [on, recordId, mode]);
  useEffect(() => () => valueChord.disable("user"), []);

  const gate = req ? valueChord.gate(req) : { allowed: false, block: "no-data" as const, modesOnly: false, trust: "stated" as const };
  const unit = source?.unit ?? "";
  const atMeasure = dialOwns && view.chord && dialStop(art) === 0 && gate.block === "off";
  const text = atMeasure ? t("cv.chord.atMeasure") : chordText(t, state.lang, gate, tones, unit, state.verbosity === "brief");
  const short = chordShort(gate, tones, unit);

  const said = useRef("");
  useEffect(() => {
    const line = tones.length ? (shortLines.on ? short : text) : "";
    if (line && line !== said.current) announce(line);
    said.current = line;
  }, [tones, text, short, shortLines.on, announce]);

  return { gate, tones, text, short, sigma };
}
