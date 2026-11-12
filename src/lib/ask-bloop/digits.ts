// Ask Bloop's digit-provenance check (spec §6.4): every number in an answer must be one an engine call returned in
// that turn (formatted as the app formats it), or part of a date or record id from the manifest. Used at runtime (a
// failing answer is replaced by its plain template) and in the tests (a failure fails the build).
import { asciiDigits } from "./normalise";

/** Every number in a text, as ASCII digits: Bangla digits converted, thousands separators dropped, minus signs ignored. */
export function numbersIn(text: string): string[] {
  const plain = asciiDigits(text).replace(/(\d)[,٬](?=\d{3}(?!\d))/gu, "$1");
  return [...plain.matchAll(/\d+(?:\.\d+)?/gu)].map((m) => m[0]);
}

/** True when every number in `answer` appears among the numbers of `sources` (the turn's engine results and dates). */
export function digitsTrace(answer: string, sources: readonly string[]): boolean {
  const allowed = new Set(sources.flatMap(numbersIn));
  return numbersIn(answer).every((n) => allowed.has(n));
}
