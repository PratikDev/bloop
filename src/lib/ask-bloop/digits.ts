import { asciiDigits } from "./normalise";

function numbersIn(text: string): string[] {
  const plain = asciiDigits(text).replace(/(\d)[,٬](?=\d{3}(?!\d))/gu, "$1");
  return [...plain.matchAll(/\d+(?:\.\d+)?/gu)].map((m) => m[0]);
}

export function digitsTrace(answer: string, sources: readonly string[]): boolean {
  const allowed = new Set(sources.flatMap(numbersIn));
  return numbersIn(answer).every((n) => allowed.has(n));
}
