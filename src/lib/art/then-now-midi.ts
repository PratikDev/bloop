import { monsoonDrops } from "@/lib/audio/context-maths";
import { mapVoice } from "@/lib/audio/mapping";
import { MONTH_STEP_SEC, WINDOW_GAP_SEC, YEAR_STEP_SEC } from "@/lib/audio/players/then-now";
import type { ThenNowInput } from "@/lib/audio/types";
import { formatFixed } from "@/lib/i18n";
import { midiFile, sheetText, type MidiNote, type SheetRow } from "./midi";

export type MidiPart = "heat" | "monsoon" | "water";

interface Point {
  label: string;
  value: number | null;
  start: number;
  step: number;
}

function points(input: ThenNowInput, part: MidiPart): Point[] {
  if (part === "water") return input.water.months.map((m, i) => ({ label: m, value: input.water.cm[i], start: i * MONTH_STEP_SEC, step: MONTH_STEP_SEC }));
  const pair = part === "heat" ? input.heat : input.monsoon;
  const a = pair.A.years.map((y, i) => ({ label: String(y), value: pair.A.values[i], start: i * YEAR_STEP_SEC, step: YEAR_STEP_SEC }));
  const offset = a.length * YEAR_STEP_SEC + WINDOW_GAP_SEC;
  return [...a, ...pair.B.years.map((y, i) => ({ label: String(y), value: pair.B.values[i], start: offset + i * YEAR_STEP_SEC, step: YEAR_STEP_SEC }))];
}

const hzOf = (part: MidiPart, v: number | null) => (part === "monsoon" || v === null ? null : mapVoice(part === "heat" ? "heat" : "water", v));

export function partMidi(input: ThenNowInput, part: MidiPart): Uint8Array {
  const notes: MidiNote[] = points(input, part).flatMap((p) => {
    const hz = hzOf(part, p.value);
    return hz === null ? [] : [{ hz, start: p.start, duration: p.step * 0.9 }];
  });
  return midiFile(notes);
}

export function partSheet(title: string, input: ThenNowInput, part: MidiPart): string {
  const rows: SheetRow[] = points(input, part).map((p) => ({
    label: p.label,
    value: p.value === null ? "no value" : part === "monsoon" ? `${formatFixed(p.value, "en", 2)} (${monsoonDrops(p.value)} drops)` : formatFixed(p.value, "en", 3),
    hz: hzOf(part, p.value),
  }));
  return sheetText(title, rows);
}
