// Record codes typed into a plain <input> ("B7", "b7", "b 7", "B৭"): one parser, so a braille keyboard
// (Perkins keys through the screen reader, TalkBack's braille keyboard, iOS Braille Screen Input) and a
// normal keyboard reach the same record. The jukebox keypad uses it once it lands.

import { latinDigits } from "./brailleText";

export interface RecordCode {
  letter: string; // upper case, A–Z
  number: number;
  code: string; // canonical form, e.g. "B7"
}

const CODE = /^([a-z])\s*-?\s*(\d{1,3})$/iu;

/** A typed code → its canonical form; null when it isn't a letter followed by up to three digits. */
export function parseRecordCode(input: string): RecordCode | null {
  const m = CODE.exec(latinDigits(input).trim());
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const number = Number(m[2]);
  return { letter, number, code: `${letter}${number}` };
}
