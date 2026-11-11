export type VttKind = "metadata" | "chapters" | "captions";

export interface Cue {
  start: number;
  end: number;
  text: string;
}

export interface CueData {
  time: string | null;
  lat: number;
  lon: number;
  place: string;
  value: number | null;
  unit: string;
  note: string;
}

const MS_PER_SEC = 1000;
const SEC_PER_MIN = 60;
const MIN_PER_HOUR = 60;
const ARROW = " --> ";

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function vttTimestamp(sec: number): string {
  const ms = Math.max(0, Math.round(sec * MS_PER_SEC));
  const s = Math.floor(ms / MS_PER_SEC);
  const h = Math.floor(s / (SEC_PER_MIN * MIN_PER_HOUR));
  const m = Math.floor(s / SEC_PER_MIN) % MIN_PER_HOUR;
  return `${pad(h)}:${pad(m)}:${pad(s % SEC_PER_MIN)}.${pad(ms % MS_PER_SEC, 3)}`;
}

function parseTimestamp(text: string): number {
  const parts = text.trim().split(":").map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts];
  return h * SEC_PER_MIN * MIN_PER_HOUR + m * SEC_PER_MIN + s;
}

const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s*\n\s*/g, " ");
const unescapeText = (text: string) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export function toVtt(cues: readonly Cue[], note: string): string {
  const blocks = cues.map((c, i) => `${i + 1}\n${vttTimestamp(c.start)}${ARROW}${vttTimestamp(c.end)}\n${escapeText(c.text)}`);
  return `WEBVTT\n\nNOTE ${escapeText(note)}\n\n${blocks.join("\n\n")}\n`;
}

export function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of text.replace(/\r\n?/g, "\n").trim().split(/\n{2,}/)) {
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes(ARROW.trim()));
    if (at === -1) continue;
    const [from, rest] = lines[at].split(ARROW.trim());
    const to = rest.trim().split(/\s+/)[0];
    cues.push({ start: parseTimestamp(from), end: parseTimestamp(to), text: unescapeText(lines.slice(at + 1).join("\n")) });
  }
  return cues;
}

export const cuesStarting = (cues: readonly Cue[], after: number, upTo: number) => cues.filter((c) => c.start > after && c.start <= upTo);

export function cueAt(cues: readonly Cue[], sec: number): Cue | null {
  let found: Cue | null = null;
  for (const c of cues) if (c.start <= sec && sec < c.end) found = c;
  return found;
}

export function cueData(cue: Cue): CueData | null {
  try {
    const d = JSON.parse(cue.text) as Partial<CueData>;
    return typeof d.place === "string" && typeof d.unit === "string" ? (d as CueData) : null;
  } catch {
    return null;
  }
}

export function chain(starts: readonly { start: number; text: string }[], end: number, minSec = 0): Cue[] {
  return starts.map((c, i) => ({ ...c, end: Math.max(c.start + minSec, starts[i + 1]?.start ?? end) }));
}
