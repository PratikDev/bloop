import { mapVoice } from "@/lib/audio/mapping";
import { monsoonDrops } from "@/lib/audio/context-maths";
import type { ClimateCellName } from "@/types/data-contract";

export const NOTE_SEC = 0.25;
const LIFETIME_PARTS = ["heat", "rain", "water"] as const;
type LifetimePart = (typeof LIFETIME_PARTS)[number];

interface LifetimeTrend {
  n: number;
  p: number;
  sen_slope: number;
  sen_slope_ci: [number, number];
  test: string;
  clear: boolean;
}

interface LifetimeSeries {
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

interface SongNote {
  year: number;
  value: number;
  hz: number | null;
  drops: number;
  at: number;
}

export interface SongPart {
  part: LifetimePart;
  series: LifetimeSeries;
  from: number;
  to: number;
  notes: SongNote[];
  trend: LifetimeTrend | null;
  range: [number, number];
}

export const seriesOf = (file: LifetimeFile, city: ClimateCellName, part: LifetimePart): LifetimeSeries =>
  part === "water" ? file.water : file.cities[city][part];

function songPart(file: LifetimeFile, city: ClimateCellName, part: LifetimePart, born: number): SongPart | null {
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

export function lifetimeSong(file: LifetimeFile, city: ClimateCellName, born: number): SongPart[] {
  return LIFETIME_PARTS.map((p) => songPart(file, city, p, born)).filter((p): p is SongPart => p !== null);
}

export function bornRange(file: LifetimeFile, city: ClimateCellName): [number, number] {
  const all = LIFETIME_PARTS.map((p) => seriesOf(file, city, p));
  return [Math.min(...all.map((s) => s.years[0])), Math.max(...all.map((s) => s.years[s.years.length - 1])) - 1];
}

export const PART_GAP_SEC = 1;

export interface Scheduled {
  part: SongPart["part"];
  year: number;
  time: number;
}

export function songTimes(parts: readonly SongPart[], t0: number): Scheduled[] {
  let base = t0;
  const out: Scheduled[] = [];
  for (const p of parts) {
    for (const n of p.notes) out.push({ part: p.part, year: n.year, time: base + n.at });
    base += p.notes.length * NOTE_SEC + PART_GAP_SEC;
  }
  return out;
}

