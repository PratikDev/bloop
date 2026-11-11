// Ask Bloop's text clean-up before matching: Bangla digits to ASCII, case, punctuation, spaces; and the
// months people say ("August 2023", "আগস্ট ২০২৩", "2023-08"), read as the "YYYY-MM" the monthly records use.

const BN_ZERO = 0x09e6; // ০

/** Bangla digits (০–৯) to 0–9. */
export const asciiDigits = (s: string) => s.replace(/[০-৯]/gu, (d) => String(d.charCodeAt(0) - BN_ZERO));

/** Lower case, ASCII digits, no punctuation but the date hyphen and the apostrophe, single spaces. Bangla signs are kept. */
export function normaliseUtterance(s: string): string {
  return asciiDigits(s.normalize("NFC"))
    .toLowerCase()
    .replace(/[’`]/gu, "'")
    .replace(/[^\p{L}\p{M}\p{N}'\-\s]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Month names, January first: English (full and three-letter) and Bangla (the Gregorian months as Bangla writes them). */
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
// Word edges by lookaround: \b knows only ASCII letters, not Bangla.
const W0 = "(?<![\\p{L}\\p{M}])";
const W1 = "(?![\\p{L}\\p{M}])";
const YEAR = "(?<!\\d)(\\d{4})(?!\\d)";
/** "2023-08", or a month name and a year in either order ("august 2023", "2023 august"). */
const MONTH_RE = new RegExp(`${YEAR}-(\\d{1,2})(?!\\d)|${W0}(${MONTH_WORDS})${W1}\\s+${YEAR}|${YEAR}\\s+${W0}(${MONTH_WORDS})${W1}`, "gu");

const pad = (m: number) => String(m).padStart(2, "0");

/** Every month mentioned in a normalised utterance, in order, as "YYYY-MM" (impossible months are left out). */
export function monthsIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(MONTH_RE)) {
    const year = m[1] ?? m[4] ?? m[5];
    const month = m[2] !== undefined ? Number(m[2]) : MONTH_INDEX.get(m[3] ?? m[6] ?? "");
    if (year && month && month >= 1 && month <= 12) out.push(`${year}-${pad(month)}`);
  }
  return out;
}

/** The utterance with its months taken out (so the words left can name a place). */
export const withoutMonths = (text: string) => text.replace(MONTH_RE, " ").replace(/\s+/gu, " ").trim();
