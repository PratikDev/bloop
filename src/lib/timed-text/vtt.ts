// PURE: WebVTT text tracks (accessibility core, step 7; spec Part 3.3). Bloop's sounds are synthesised live, so the
// tracks are written from the same steps the players schedule (src/lib/timed-text/sweep.ts, timelapse.ts), offered
// as .vtt files, and parsed back to drive the "now playing" line and the sound captions: what the app shows is what
// the file says.

export type VttKind = "metadata" | "chapters" | "captions";

export interface Cue {
  /** Seconds from the start of the sound. */
  start: number;
  end: number;
  text: string;
}

/** What a metadata cue carries (one JSON object per cue, on one line). */
export interface CueData {
  /** The frame's own time (UTC, ISO 8601) for a time-lapse; null for a sweep, whose points are all one frame. */
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

/** 83.5 → "00:01:23.500" (WebVTT timestamps always carry the hours here, so every file reads the same way). */
export function vttTimestamp(sec: number): string {
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

// Cue text may not hold "-->" or a blank line; & and < start markup in captions and chapters.
const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s*\n\s*/g, " ");
const unescapeText = (text: string) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** A whole .vtt file: the header, a NOTE naming what it is, then one numbered cue per entry. */
export function toVtt(cues: readonly Cue[], note: string): string {
  const blocks = cues.map((c, i) => `${i + 1}\n${vttTimestamp(c.start)}${ARROW}${vttTimestamp(c.end)}\n${escapeText(c.text)}`);
  return `WEBVTT\n\nNOTE ${escapeText(note)}\n\n${blocks.join("\n\n")}\n`;
}

/** The cues of a .vtt file (the subset toVtt writes, plus cue settings, which are ignored). */
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

/** The cues that start in (after, upTo]: each fires once as the playhead passes it. */
export const cuesStarting = (cues: readonly Cue[], after: number, upTo: number) => cues.filter((c) => c.start > after && c.start <= upTo);

/** The cue showing at `sec` (the latest one that has started and not ended), or null. */
export function cueAt(cues: readonly Cue[], sec: number): Cue | null {
  let found: Cue | null = null;
  for (const c of cues) if (c.start <= sec && sec < c.end) found = c;
  return found;
}

/** A metadata cue's data, or null when its text isn't one of ours. */
export function cueData(cue: Cue): CueData | null {
  try {
    const d = JSON.parse(cue.text) as Partial<CueData>;
    return typeof d.place === "string" && typeof d.unit === "string" ? (d as CueData) : null;
  } catch {
    return null;
  }
}

/** Each cue ends where the next begins (the last one at `end`), never shorter than `minSec`. */
export function chain(starts: readonly { start: number; text: string }[], end: number, minSec = 0): Cue[] {
  return starts.map((c, i) => ({ ...c, end: Math.max(c.start + minSec, starts[i + 1]?.start ?? end) }));
}
