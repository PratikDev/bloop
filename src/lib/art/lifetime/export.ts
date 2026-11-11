import { formatFixed } from "@/lib/i18n";
import { midiFile, sheetText, type MidiNote, type SheetRow } from "../midi";
import { NOTE_SEC, songTimes, type SongPart } from "./song";

export function songMidi(parts: readonly SongPart[]): Uint8Array {
  const times = songTimes(parts, 0);
  const notes: MidiNote[] = [];
  let k = 0;
  for (const p of parts) for (const n of p.notes) {
    const t = times[k++].time;
    if (n.hz !== null) notes.push({ hz: n.hz, start: t, duration: NOTE_SEC * 0.88 });
  }
  return midiFile(notes);
}

export function songSheet(title: string, parts: readonly SongPart[]): string {
  const rows: SheetRow[] = parts.flatMap((p) => [
    { label: `# ${p.part} (${p.series.source}, ${p.series.season})`, value: p.series.unit, hz: null },
    ...p.notes.map((n) => ({ label: String(n.year), value: n.hz === null ? `${formatFixed(n.value, "en", 2)} (${n.drops} drops)` : formatFixed(n.value, "en", 3), hz: n.hz })),
  ]);
  return sheetText(title, rows);
}
