const PPQ = 480;
const TICKS_PER_SEC = 960;
export const BEND_RANGE_CENTS = 200;

export interface MidiNote {
  hz: number;
  start: number;
  duration: number;
}

function toMidi(hz: number): { note: number; bend: number; cents: number } {
  const exact = 69 + 12 * Math.log2(hz / 440);
  const note = Math.min(127, Math.max(0, Math.round(exact)));
  const cents = (exact - note) * 100;
  const bend = Math.min(16383, Math.max(0, Math.round(8192 + (cents / BEND_RANGE_CENTS) * 8192)));
  return { note, bend, cents };
}

function vlq(n: number): number[] {
  const out = [n & 0x7f];
  for (let v = n >> 7; v > 0; v >>= 7) out.unshift((v & 0x7f) | 0x80);
  return out;
}

const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

export function midiFile(notes: readonly MidiNote[]): Uint8Array {
  type Ev = { tick: number; order: number; bytes: number[] };
  const evs: Ev[] = [
    { tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, 0x07, 0xa1, 0x20] },
    { tick: 0, order: 0, bytes: [0xb0, 101, 0] },
    { tick: 0, order: 0, bytes: [0xb0, 100, 0] },
    { tick: 0, order: 0, bytes: [0xb0, 6, BEND_RANGE_CENTS / 100] },
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

export interface SheetRow {
  label: string;
  value: string;
  hz: number | null;
}

export function sheetText(title: string, rows: readonly SheetRow[]): string {
  const name = (n: number) => `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][n % 12]}${Math.floor(n / 12) - 1}`;
  const lines = rows.map((r) => {
    if (r.hz === null) return `${r.label}\t${r.value}\t-\t-\t-`;
    const m = toMidi(r.hz);
    return `${r.label}\t${r.value}\t${r.hz.toFixed(3)} Hz\t${name(m.note)} (${m.note})\t${m.cents >= 0 ? "+" : "-"}${Math.abs(m.cents).toFixed(1)} cents`;
  });
  return [title, "", "when\tvalue\tfrequency\tnote\tbend", ...lines, "", `Pitch bend range: +/-${BEND_RANGE_CENTS / 100} semitones.`].join("\n") + "\n";
}
