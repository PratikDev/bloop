// PURE: "The song of your lifetime" (docs/statement/ART.md). A city's yearly series from a birth year to the latest
// year (public/data/thenvsnow/lifetime.json, written by pipeline/stats/lifetime_stats.py), one note per year at four
// notes a second, through the existing rules: heat → pitch (the heat rule), rain → that many drops (the monsoon rule),
// water → pitch (the water rule, one fixed range). The trend from that year comes from the file: nothing here computes
// a statistic. No birth year is ever stored.

import { mapVoice } from "@/lib/audio/mapping";
import { monsoonDrops } from "@/lib/audio/context-maths";
import type { ClimateCellName } from "@/types/data-contract";

export const NOTE_SEC = 0.25;
export const LIFETIME_PARTS = ["heat", "rain", "water"] as const;
export type LifetimePart = (typeof LIFETIME_PARTS)[number];

export interface LifetimeTrend {
  n: number;
  p: number;
  sen_slope: number;
  sen_slope_ci: [number, number];
  test: string;
  clear: boolean;
}

export interface LifetimeSeries {
  source: string;
  unit: string;
  voice: "heat" | "monsoon" | "water";
  season: string;
  years: number[];
  values: number[];
  trends: Record<string, LifetimeTrend | null>;
}

export interface LifetimeFile {
  method: { alpha: number; min_years: number; trend: string; clear_rule: string; water: string; script: string };
  credit: string;
  cities: Record<ClimateCellName, { heat: LifetimeSeries; rain: LifetimeSeries }>;
  water: LifetimeSeries;
}

export interface SongNote {
  year: number;
  value: number;
  /** Heat and water: the rule's pitch (Hz). Rain: null (it plays drops). */
  hz: number | null;
  /** Rain: the monsoon rule's drops for the year. */
  drops: number;
  /** Start (s from the part's start). */
  at: number;
}

export interface SongPart {
  part: LifetimePart;
  series: LifetimeSeries;
  /** The first year played (the birth year, or the record's first year if it starts later). */
  from: number;
  to: number;
  notes: SongNote[];
  trend: LifetimeTrend | null;
  /** The values' range (always shown, also when there is too few years for a test). */
  range: [number, number];
}

export const seriesOf = (file: LifetimeFile, city: ClimateCellName, part: LifetimePart): LifetimeSeries =>
  part === "water" ? file.water : file.cities[city][part];

/** One part's song from `born`; null when the record ends before it. */
export function songPart(file: LifetimeFile, city: ClimateCellName, part: LifetimePart, born: number): SongPart | null {
  const s = seriesOf(file, city, part);
  const idx = s.years.map((y, i) => [y, i] as const).filter(([y]) => y >= born);
  if (!idx.length) return null;
  const notes = idx.map(([year, i], k): SongNote => {
    const value = s.values[i];
    return { year, value, hz: s.voice === "monsoon" ? null : mapVoice(s.voice, value), drops: s.voice === "monsoon" ? monsoonDrops(value) : 0, at: k * NOTE_SEC };
  });
  const values = notes.map((n) => n.value);
  return {
    part,
    series: s,
    from: notes[0].year,
    to: notes[notes.length - 1].year,
    notes,
    trend: s.trends[String(notes[0].year)] ?? null,
    range: [Math.min(...values), Math.max(...values)],
  };
}

/** The whole song: heat, rain, then water (when its years overlap), each part one note per year. */
export function lifetimeSong(file: LifetimeFile, city: ClimateCellName, born: number): SongPart[] {
  return LIFETIME_PARTS.map((p) => songPart(file, city, p, born)).filter((p): p is SongPart => p !== null);
}

/** Birth years the picker offers: any year inside the records, up to the year before the latest. */
export function bornRange(file: LifetimeFile, city: ClimateCellName): [number, number] {
  const all = LIFETIME_PARTS.map((p) => seriesOf(file, city, p));
  return [Math.min(...all.map((s) => s.years[0])), Math.max(...all.map((s) => s.years[s.years.length - 1])) - 1];
}

export const PART_GAP_SEC = 1;

export interface Scheduled {
  part: SongPart["part"];
  year: number;
  /** On the audio clock. */
  time: number;
}

/** When each note of the song sounds, from `t0` (pure: the player and its playhead share it). */
export function songTimes(parts: readonly SongPart[], t0: number): Scheduled[] {
  let base = t0;
  const out: Scheduled[] = [];
  for (const p of parts) {
    for (const n of p.notes) out.push({ part: p.part, year: n.year, time: base + n.at });
    base += p.notes.length * NOTE_SEC + PART_GAP_SEC;
  }
  return out;
}

