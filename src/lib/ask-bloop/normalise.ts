const BN_ZERO = 0x09e6;

export const asciiDigits = (s: string) => s.replace(/[০-৯]/gu, (d) => String(d.charCodeAt(0) - BN_ZERO));

export function normaliseUtterance(s: string): string {
  return asciiDigits(s.normalize("NFC"))
    .toLowerCase()
    .replace(/[’`]/gu, "'")
    .replace(/[^\p{L}\p{M}\p{N}'\-\s]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

const MONTHS: readonly (readonly string[])[] = [
  ["january", "jan", "জানুয়ারি"],
  ["february", "feb", "ফেব্রুয়ারি"],
  ["march", "mar", "মার্চ"],
  ["april", "apr", "এপ্রিল"],
  ["may", "মে"],
  ["june", "jun", "জুন"],
  ["july", "jul", "জুলাই"],
  ["august", "aug", "আগস্ট"],
  ["september", "sep", "sept", "সেপ্টেম্বর"],
  ["october", "oct", "অক্টোবর"],
  ["november", "nov", "নভেম্বর"],
  ["december", "dec", "ডিসেম্বর"],
];

const MONTH_INDEX = new Map(MONTHS.flatMap((names, i) => names.map((n) => [n, i + 1] as const)));
const MONTH_WORDS = [...MONTH_INDEX.keys()].sort((a, b) => b.length - a.length).join("|");
const W0 = "(?<![\\p{L}\\p{M}])";
const W1 = "(?![\\p{L}\\p{M}])";
const YEAR = "(?<!\\d)(\\d{4})(?!\\d)";
const MONTH_RE = new RegExp(`${YEAR}-(\\d{1,2})(?!\\d)|${W0}(${MONTH_WORDS})${W1}\\s+${YEAR}|${YEAR}\\s+${W0}(${MONTH_WORDS})${W1}`, "gu");

const pad = (m: number) => String(m).padStart(2, "0");

export function monthsIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(MONTH_RE)) {
    const year = m[1] ?? m[4] ?? m[5];
    const month = m[2] !== undefined ? Number(m[2]) : MONTH_INDEX.get(m[3] ?? m[6] ?? "");
    if (year && month && month >= 1 && month <= 12) out.push(`${year}-${pad(month)}`);
  }
  return out;
}

export const withoutMonths = (text: string) => text.replace(MONTH_RE, " ").replace(/\s+/gu, " ").trim();
