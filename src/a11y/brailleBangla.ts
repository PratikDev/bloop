// Braille lines for the Bengali table (liblouis bn.tbl, as NVDA ships it). That table reads Latin letters as Bangla
// letters (SST → সসত) and drops the numeric indicator after a decimal point or a colon (30.2 → ৩০.ব, 10:30 → ১০ঞচজ):
// tests/braille/louis_check.py, 4 Nov 2026. So in বাংলা mode the braille lines are written for that table: Bangla
// words only (no Latin letters), decimals as a word (30 দশমিক 2), times without a colon (10টা 30 মিনিট).
// Two more things the same check found in bn.tbl, worked around here:
//  - Bangla digits (০–৯) are only "litdigit": they get no number sign, so ৩০ is ⠉⠚ and reads as the letters চজ.
//    Western digits get the sign: 30 is ⠼⠉⠚ and reads as ৩০. So the braille line writes Western digits: on the
//    display they are the correctly marked Bangla numerals (the screen text shows 30 দশমিক 2).
//  - The combining nukta (U+09BC) is undefined: য + ় comes out as the text "	bc" spelled in cells. The
//    precomposed letters (য় U+09DF, ড় U+09DC, ঢ় U+09DD) are defined, so the line uses them (bnCompose).
// Numbers still come only from the record (the caller passes the value and its stated precision).
// Words marked TEAM are the team's (4 Nov 2026); the rest are DRAFT and need review by a Bangla speaker
// (docs/accessibility/BRAILLE.md lists them). A term with no entry is left out of the line, never written in Latin.

import { brailleNumber } from "./brailleText";

/** য + ় → য়, ড + ় → ড়, ঢ + ় → ঢ় (bn.tbl defines the precomposed letters only; NFC text has the pair). */
export function bnCompose(s: string): string {
  // U+09AF U+09BC → U+09DF, U+09A1 U+09BC → U+09DC, U+09A2 U+09BC → U+09DD
  return s.replace(/য়/gu, "য়").replace(/ড়/gu, "ড়").replace(/ঢ়/gu, "ঢ়");
}

/** A number at its stated precision, the decimal point as the word দশমিক: 30.2 → "30 দশমিক 2" (on the display: ৩০ দশমিক ২). */
export function bnNumber(value: number, decimals: number): string {
  const [whole, frac] = brailleNumber(value, decimals).split(".");
  return frac ? `${whole} দশমিক ${frac}` : whole;
}

export const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]; // DRAFT

/** A UTC time with no colon: "1 নভেম্বর 0টা", "3 নভেম্বর 10টা 30 মিনিট" (the year only when it isn't this year). */
export function bnTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear() === now.getUTCFullYear() ? "" : ` ${d.getUTCFullYear()}`;
  const date = `${d.getUTCDate()} ${BN_MONTHS[d.getUTCMonth()]}${year}`;
  const m = d.getUTCMinutes();
  return `${date} ${d.getUTCHours()}টা${m ? ` ${m} মিনিট` : ""}`; // টা, মিনিট: TEAM
}

/** A place: "21 দশমিক 5 উত্তর 89 দশমিক 8 পূর্ব". */
export function bnPlace(lat: number, lon: number): string {
  const ns = lat >= 0 ? BN.north : BN.south;
  const ew = lon >= 0 ? BN.east : BN.west;
  return `${bnNumber(Math.abs(lat), 1)} ${ns} ${bnNumber(Math.abs(lon), 1)} ${ew}`;
}

/** Fixed words. */
export const BN = {
  north: "উত্তর", // TEAM
  east: "পূর্ব", // TEAM
  south: "দক্ষিণ", // DRAFT
  west: "পশ্চিম", // DRAFT
  noData: "তথ্য নেই", // DRAFT
  dry: "শুকনো", // DRAFT
  snow: "তুষার", // DRAFT
  orLess: "বা কম", // DRAFT: "at or below" after the value
  utc: "ইউটিসি", // DRAFT
  scale: "স্কেল", // DRAFT
  relativeScale: "আপেক্ষিক আকার, স্কেল", // DRAFT
  to: "থেকে", // DRAFT: "-৫ থেকে ৩৫"
  log: "লগ", // DRAFT
  record: "রেকর্ড", // DRAFT
  across: "বাম থেকে", // DRAFT: frame position, percent across
  up: "নিচ থেকে", // DRAFT: percent up
  percent: "শতাংশ", // DRAFT
  approx: "আনুমানিক", // DRAFT
} as const;

/** Badges and statuses. */
export const BN_STATUS: Record<string, string> = {
  observation: "পর্যবেক্ষণ", // DRAFT
  model: "মডেল", // DRAFT
  reanalysis: "পুনর্বিশ্লেষণ", // DRAFT
  live: "সরাসরি", // DRAFT
  stale: "পুরোনো", // DRAFT
  verified: "যাচাই করা", // DRAFT
  "values with stated error": "ত্রুটিসহ মান", // DRAFT
  relative: "আপেক্ষিক", // DRAFT
  "pattern only": "শুধু ধরন", // DRAFT
  "visual texture": "শুধু ছবি", // DRAFT
  "no check": "যাচাই হয়নি", // DRAFT
  "insufficient data": "যথেষ্ট তথ্য নেই", // DRAFT
};

/** Units (a relative unit is dropped: the line already says "relative"). */
export const BN_UNITS: Record<string, string> = {
  "°C": "ডিগ্রি সেলসিয়াস", // TEAM (deg C)
  "mm/h": "মিমি প্রতি ঘণ্টা", // TEAM
  "mm/hr": "মিমি প্রতি ঘণ্টা", // TEAM (same unit)
  ppbv: "পিপিবিভি", // DRAFT
  ppm: "পিপিএম", // DRAFT
  PSU: "পিএসইউ", // DRAFT
  "µg/m³": "মাইক্রোগ্রাম প্রতি ঘনমিটার", // DRAFT
  "mg/m³": "মিলিগ্রাম প্রতি ঘনমিটার", // DRAFT
  "m/s": "মিটার প্রতি সেকেন্ড", // DRAFT
  "km/day": "কিলোমিটার প্রতি দিন", // DRAFT
  "g/kg": "গ্রাম প্রতি কিলোগ্রাম", // DRAFT
  m: "মিটার", // DRAFT
  mm: "মিমি", // DRAFT
  K: "কেলভিন", // DRAFT
  "%": "শতাংশ", // DRAFT
  index: "সূচক", // DRAFT
  "flashes per cell": "বজ্রপাত প্রতি ঘর", // DRAFT
  "Flashes/km²/year": "বজ্রপাত প্রতি বর্গকিলোমিটার প্রতি বছর", // DRAFT
};

/** Layer names (by layer id, before any _bd / _global suffix). */
export const BN_LAYERS: Record<string, string> = {
  ocean: "সমুদ্রপৃষ্ঠের তাপমাত্রা", // TEAM (SST)
  sst: "সমুদ্রপৃষ্ঠের তাপমাত্রা", // TEAM (SST)
  rain: "বৃষ্টি", // DRAFT
  sea_salt: "সমুদ্র লবণ", // DRAFT
  dust: "ধুলা", // DRAFT
  smoke: "ধোঁয়া", // DRAFT
  sulfate: "সালফেট", // DRAFT
  co: "কার্বন মনোক্সাইড", // DRAFT
  co2: "কার্বন ডাই অক্সাইড", // DRAFT
  nox: "নাইট্রোজেন অক্সাইড", // DRAFT
  o3: "ওজোন", // DRAFT
  pm25: "সূক্ষ্ম কণা", // DRAFT (PM2.5)
  salinity: "লবণাক্ততা", // DRAFT
  temperature: "তাপমাত্রা", // DRAFT
  flashes: "বজ্রপাত", // DRAFT
  height: "উচ্চতা", // DRAFT
  brightness: "উজ্জ্বলতা", // DRAFT
  transport: "জলীয় বাষ্প পরিবহন", // DRAFT
  change: "পরিবর্তন", // DRAFT
};
const BN_AREAS: Record<string, string> = { bd: "বাংলাদেশ", global: "বিশ্ব" }; // DRAFT

/** A layer id's Bangla name ("co_global" → "কার্বন মনোক্সাইড বিশ্ব"); "" when there is none (never Latin). */
export function bnLayer(id: string): string {
  const [head, ...rest] = id.split("_");
  const whole = BN_LAYERS[id];
  if (whole) return whole;
  const name = BN_LAYERS[head] ?? BN_LAYERS[id.replace(/_(bd|global|agulhas|gulf_stream|kuroshio)$/u, "")];
  if (!name) return "";
  const area = BN_AREAS[rest.join("_")];
  return area ? `${name} ${area}` : name;
}

/** A unit's Bangla words; "" for a relative unit or one with no entry. */
export function bnUnit(unit: string): string {
  if (/^relative/iu.test(unit)) return "";
  return BN_UNITS[unit] ?? BN_UNITS[unit.split(" ")[0]] ?? "";
}

/**
 * True when `s` is safe for the Bengali table: no Latin letters, no colon, no dot between digits, no Bangla digits
 * (no number sign in bn.tbl) and no combining nukta (undefined in bn.tbl).
 */
export function bnTableSafe(s: string): boolean {
  return !/[A-Za-z]/u.test(s) && !/:/u.test(s) && !/[0-9]\.[0-9]/u.test(s) && !/[০-৯]/u.test(s) && !/়/u.test(s);
}
