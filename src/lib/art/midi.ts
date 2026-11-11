// PURE: MIDI export for a human performer. Each value's exact frequency becomes the
// nearest MIDI note plus a pitch bend; the bend range is set to ±2 semitones (RPN 0) at the start, so a bend of
// b (−8192 … +8191) means b / 8192 × 200 cents. One note per value, at the song's own timing. Standard MIDI File,
// format 0, 480 ticks per quarter note at 120 bpm (960 ticks a second). readMidi reads it back (the 1-cent test).

export const PPQ = 480;
export const TICKS_PER_SEC = 960; // 120 bpm
export const BEND_RANGE_CENTS = 200;

export interface MidiNote {
  hz: number;
  start: number; // s
  duration: number; // s
}

/** A frequency as a MIDI note and a 14-bit pitch bend (8192 = none). */
export function toMidi(hz: number): { note: number; bend: number; cents: number } {
  const exact = 69 + 12 * Math.log2(hz / 440);
  const note = Math.min(127, Math.max(0, Math.round(exact)));
  const cents = (exact - note) * 100;
  const bend = Math.min(16383, Math.max(0, Math.round(8192 + (cents / BEND_RANGE_CENTS) * 8192)));
  return { note, bend, cents };
}

export const fromMidi = (note: number, bend: number) => 440 * 2 ** ((note - 69 + ((bend - 8192) / 8192) * (BEND_RANGE_CENTS / 100)) / 12);

function vlq(n: number): number[] {
  const out = [n & 0x7f];
  for (let v = n >> 7; v > 0; v >>= 7) out.unshift((v & 0x7f) | 0x80);
  return out;
}

const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

/** A one-track Standard MIDI File of the notes (channel 1, velocity 80). */
export function midiFile(notes: readonly MidiNote[]): Uint8Array {
  type Ev = { tick: number; order: number; bytes: number[] };
  const evs: Ev[] = [
    { tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, 0x07, 0xa1, 0x20] }, // tempo 500 000 µs per quarter (120 bpm)
    { tick: 0, order: 0, bytes: [0xb0, 101, 0] },
    { tick: 0, order: 0, bytes: [0xb0, 100, 0] },
    { tick: 0, order: 0, bytes: [0xb0, 6, BEND_RANGE_CENTS / 100] }, // RPN 0: bend range in semitones
    { tick: 0, order: 0, bytes: [0xb0, 38, 0] },
  ];
  for (const n of notes) {
    const { note, bend } = toMidi(n.hz);
    const on = Math.round(n.start * TICKS_PER_SEC);
    const off = Math.max(on + 1, Math.round((n.start + n.duration) * TICKS_PER_SEC));
    evs.push({ tick: on, order: 2, bytes: [0xe0, bend & 0x7f, (bend >> 7) & 0x7f] });
    evs.push({ tick: on, order: 3, bytes: [0x90, note, 80] });
    evs.push({ tick: off, order: 1, bytes: [0x80, note, 0] });
  }
  evs.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track: number[] = [];
  let last = 0;
  for (const e of evs) {
    track.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  track.push(0, 0xff, 0x2f, 0x00);
  const header = [0x4d, 0x54, 0x68, 0x64, ...u32(6), 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff];
  return Uint8Array.from([...header, 0x4d, 0x54, 0x72, 0x6b, ...u32(track.length), ...track]);
}

/** Reads back the notes (frequency from note + bend, start in s) of a file written by midiFile. */
export function readMidi(bytes: Uint8Array): { hz: number; start: number }[] {
  let i = 22; // header (14) + "MTrk" + length
  let tick = 0;
  let bend = 8192;
  let status = 0;
  const out: { hz: number; start: number }[] = [];
  const readVlq = () => {
    let n = 0;
    for (;;) {
      const b = bytes[i++];
      n = (n << 7) | (b & 0x7f);
      if (!(b & 0x80)) return n;
    }
  };
  while (i < bytes.length) {
    tick += readVlq();
    if (bytes[i] === 0xff) {
      const type = bytes[i + 1];
      i += 2;
      const len = readVlq();
      i += len;
      if (type === 0x2f) break;
      continue;
    }
    if (bytes[i] & 0x80) status = bytes[i++];
    const kind = status & 0xf0;
    const a = bytes[i++];
    const b = kind === 0xc0 || kind === 0xd0 ? 0 : bytes[i++];
    if (kind === 0xe0) bend = a | (b << 7);
    if (kind === 0x90 && b > 0) out.push({ hz: fromMidi(a, bend), start: tick / TICKS_PER_SEC });
  }
  return out;
}

export interface SheetRow {
  label: string;
  value: string;
  hz: number | null;
}

/** The performer's sheet: label, value, exact frequency, note and bend in cents (so rounding can be checked). */
export function sheetText(title: string, rows: readonly SheetRow[]): string {
  const name = (n: number) => `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][n % 12]}${Math.floor(n / 12) - 1}`;
  const lines = rows.map((r) => {
    if (r.hz === null) return `${r.label}\t${r.value}\t-\t-\t-`;
    const m = toMidi(r.hz);
    return `${r.label}\t${r.value}\t${r.hz.toFixed(3)} Hz\t${name(m.note)} (${m.note})\t${m.cents >= 0 ? "+" : "-"}${Math.abs(m.cents).toFixed(1)} cents`;
  });
  return [title, "", "when\tvalue\tfrequency\tnote\tbend", ...lines, "", `Pitch bend range: +/-${BEND_RANGE_CENTS / 100} semitones.`].join("\n") + "\n";
}
