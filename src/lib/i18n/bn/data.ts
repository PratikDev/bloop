// Bangla for the English prose that arrives in data files (L1's JSON, L2's
// mapping.json). Those files stay English; the app translates what it shows,
// trying three ways in order:
//  1. EXACT: the whole sentence.
//  2. TEMPLATES: the sentence with every number written "#". The Bangla takes
//     the source's own numbers ({0}, {1}, …), so no number is typed here.
//  3. PATTERNS: sentences that carry names (places), as regular expressions.
// A sentence that matches none (a file changed its wording) stays English
// rather than show an out-of-date translation.
import { localDigits } from "../format";
import { placeBn } from "./places";
import { EXACT } from "./data-exact";

const d = (s: string) => localDigits(s, "bn");

/** A number as the files write it: an optional sign (the true minus), digits, decimals. */
const NUMBER = /[+−]?\d+(?:\.\d+)?/g;

const HEMISPHERE: Record<string, string> = { N: "উত্তর", S: "দক্ষিণ", E: "পূর্ব", W: "পশ্চিম" };

const TEMPLATES: Record<string, string> = {
  // A bare number, and mapping.json's legend points.
  "#": "{0}",
  "# °C": "{0} °সে",
  "# °C (the #–# normal)": "{0} °সে ({1}–{2}-এর স্বাভাবিক)",
  "# mm/h (light)": "{0} মিমি/ঘণ্টা (হালকা)",
  "# mm/h (moderate)": "{0} মিমি/ঘণ্টা (মাঝারি)",
  "# mm/h (heavy)": "{0} মিমি/ঘণ্টা (ভারী)",
  "# mm/day": "{0} মিমি/দিন",
  "# (sparse)": "{0} (বিরল)",
  "# (dense)": "{0} (ঘন)",

  // mapping.json, with numbers.
  "A second, detuned voice under the heat voice; roughness is a fast (~# Hz) wobble": "তাপের কণ্ঠের নিচে দ্বিতীয় একটি ডিটিউন করা কণ্ঠ; রুক্ষতা হলো দ্রুত (~{0} Hz) কাঁপুনি",
  "Very soft, short tick (~# ms)": "খুব নরম, ছোট টিক (~{0} মি.সে.)",
  "Single # m pixels. Legend points are our choice.": "একক {0} মিটার পিক্সেল। লেজেন্ডের বিন্দুগুলো আমাদের বেছে নেওয়া।",
  "The pitch range covers the #th to #th percentile of the series being played; the legend is built from that series.":
    "সুরের পরিসর বাজানো ধারাটির {0}তম থেকে {1}তম পারসেন্টাইল জুড়ে; লেজেন্ডও সেই ধারা থেকে তৈরি।",
  "Low sine with #nd and #rd harmonics so the pitch is heard on small speakers": "{0}য় ও {1}য় হারমোনিকসহ নিচু সাইন তরঙ্গ, যাতে ছোট স্পিকারেও সুর শোনা যায়",
  "No satellite measurements that month (e.g. Jul # – May #, between GRACE and GRACE-FO).":
    "সেই মাসে কোনো স্যাটেলাইট পরিমাপ নেই (যেমন জুলাই {0} – মে {1}, GRACE ও GRACE-FO-এর মাঝের সময়)।",
  "Each note is one latitude band's mean ocean temperature, using the ocean rule; bands #°S–#°S, #°S–#°, #°–#°N, #°N–#°N, played south to north (our choice).":
    "প্রতিটি নোট একটি অক্ষাংশ-বলয়ের গড় সমুদ্র-তাপমাত্রা, সমুদ্রের নিয়মে; বলয়গুলো {0}° দক্ষিণ–{1}° দক্ষিণ, {2}° দক্ষিণ–{3}°, {4}°–{5}° উত্তর, {6}° উত্তর–{7}° উত্তর, দক্ষিণ থেকে উত্তরে বাজে (আমাদের পছন্দ)।",

  // L1's files.
  "Water storage (GRACE): Bangladesh # → # cm; NW India # → # cm (#–# vs #–#). Silence = no satellite measurements (Jul #–May #).":
    "পানির মজুদ (GRACE): বাংলাদেশ {0} → {1} সেমি; উত্তর-পশ্চিম ভারত {2} → {3} সেমি ({4}–{5} বনাম {6}–{7})। নীরবতা = কোনো স্যাটেলাইট পরিমাপ নেই (জুলাই {8} – মে {9})।",
  "No satellite measurements Jul # - May # (between GRACE and GRACE-FO).": "জুলাই {0} – মে {1} পর্যন্ত কোনো স্যাটেলাইট পরিমাপ নেই (GRACE ও GRACE-FO-এর মাঝের সময়)।",
  "GPCC stops at # because the gauge version we use (GPCC Full Data Monthly V#) ends in December #, so both rain records compare #–# with #–#.":
    "GPCC {0} সালে থামে, কারণ আমাদের ব্যবহৃত বৃষ্টিমাপক সংস্করণ (GPCC Full Data Monthly V{1}) ডিসেম্বর {2}-এ শেষ; তাই দুটি বৃষ্টির রেকর্ডই {3}–{4}-কে {5}–{6}-এর সাথে তুলনা করে।",
  "GPCP only, newer decade; GPCC data ends in #": "শুধু GPCP, নতুন দশক; GPCC ডেটা {0} সালে শেষ",
  "No satellite measurements Jul # - May #.": "জুলাই {0} – মে {1} পর্যন্ত কোনো স্যাটেলাইট পরিমাপ নেই।",
  "Single # m pixels.": "একক {0} মিটার পিক্সেল।",
  "Before # GPCP uses a coarser estimate.": "{0}-এর আগে GPCP একটি মোটা দাগের অনুমান ব্যবহার করে।",
  "Before # GPCP uses a coarser estimate; cells are ~# km wide.": "{0}-এর আগে GPCP একটি মোটা দাগের অনুমান ব্যবহার করে; প্রতিটি সেল প্রায় {1} কিমি চওড়া।",
  "Three NASA records at their own resolutions (about #, # and # degrees). Missing data = silence. Voices moving together does not mean one causes the other.":
    "নাসার তিনটি রেকর্ড, প্রতিটি নিজস্ব রেজোলিউশনে (প্রায় {0}, {1} ও {2} ডিগ্রি)। তথ্য না থাকলে নীরবতা। কণ্ঠগুলো একসাথে ওঠানামা করলেই একটি অন্যটির কারণ নয়।",
  "Bangladesh box (lon #–#, lat #–#): the same national record as the Dhaka demo": "বাংলাদেশ বক্স (দ্রাঘিমাংশ {0}–{1}, অক্ষাংশ {2}–{3}): ঢাকার ডেমোর মতো একই জাতীয় রেকর্ড",
  "Ground vs satellite cloud cover (GLOBE, Bangladesh, #)": "মাটি বনাম স্যাটেলাইট: মেঘের আবরণ (GLOBE, বাংলাদেশ, {0})",
  "Two perspectives, not right vs wrong: an observer sees the sky from below at one spot; the satellite sees from above over a wider area. Differences are expected. Reports from the same day within # km are combined.":
    "দুটি দৃষ্টিভঙ্গি, ঠিক বনাম ভুল নয়: একজন পর্যবেক্ষক এক জায়গায় দাঁড়িয়ে নিচ থেকে আকাশ দেখেন; স্যাটেলাইট ওপর থেকে আরও বড় এলাকা দেখে। পার্থক্য থাকাই স্বাভাবিক। একই দিনের {0} কিমির মধ্যের প্রতিবেদনগুলো একসাথে ধরা হয়েছে।",
  "start of the #-minute period": "{0} মিনিটের সময়কালের শুরু",
};

interface Pattern {
  re: RegExp;
  to: (m: RegExpExecArray) => string;
}

const RAIN_PHRASE: Record<string, string> = {
  "no wetter in these records": "এই রেকর্ডগুলোতে বেশি ভেজা নয়।",
  "wetter in these records": "এই রেকর্ডগুলোতে আরও ভেজা।",
  "no clear change": "স্পষ্ট কোনো পরিবর্তন নেই।",
};

const PATTERNS: Pattern[] = [
  // L1's heat caption (build_demo.py heat_caption).
  {
    re: /^(.+), April–May: ([+−]?[\d.]+) °C \(NASA GISTEMP, (\d+)–(\d+) vs (\d+)–(\d+), (\d+) years each\)\.(?: Same NASA GISTEMP grid cell as (.+): this is the same record\.)?$/,
    to: (m) =>
      `${placeBn(m[1])}, এপ্রিল–মে: ${d(m[2])} °সে (NASA GISTEMP, ${d(m[3])}–${d(m[4])} বনাম ${d(m[5])}–${d(m[6])}, প্রতিটিতে ${d(m[7])} বছর)।` +
      (m[8] ? ` ${placeBn(m[8])} ও এটি একই NASA GISTEMP গ্রিড সেলে: এটি একই রেকর্ড।` : ""),
  },
  // L1's rain caption (build_demo.py rain_caption).
  {
    re: /^(.+), June–September: (no wetter in these records|wetter in these records|no clear change)\. GPCP ([+−]?\d+)% \((\d+)–(\d+) vs (\d+)–(\d+)\); rain gauges \(GPCC\) ([+−]?\d+)% \((\d+)–(\d+) vs (\d+)–(\d+)\)\.(?: Same GPCP and GPCC grid cells as (.+): this is the same record\.)?$/,
    to: (m) =>
      `${placeBn(m[1])}, জুন–সেপ্টেম্বর: ${RAIN_PHRASE[m[2]]} GPCP ${d(m[3])}% (${d(m[4])}–${d(m[5])} বনাম ${d(m[6])}–${d(m[7])}); ` +
      `বৃষ্টিমাপক যন্ত্র (GPCC) ${d(m[8])}% (${d(m[9])}–${d(m[10])} বনাম ${d(m[11])}–${d(m[12])})।` +
      (m[13] ? ` ${placeBn(m[13])} ও এটি একই GPCP ও GPCC গ্রিড সেলে: এটি একই রেকর্ড।` : ""),
  },
  // places.json water regions: "3° GRACE cell 21°N–24°N, 87°E–90°E".
  {
    re: /^(\d+)° GRACE cell (.+)$/,
    to: (m) => `${d(m[1])}° GRACE সেল ${m[2].replace(/(\d+)°([NSEW])/g, (_, n: string, h: string) => `${d(n)}° ${HEMISPHERE[h]}`)}`,
  },
  // rain.json's dataset, with L1's note on which IMERG run the frames match.
  {
    re: /^(.+): newest frames match the (\w+) run; older frames matched the (\w+) run$/,
    to: (m) => `${m[1]}: নতুন ফ্রেমগুলো ${m[2]} রানের সাথে মেলে; পুরোনো ফ্রেমগুলো মিলেছিল ${m[3]} রানের সাথে`,
  },
];

function fromTemplate(text: string): string | null {
  const template = TEMPLATES[text.replace(NUMBER, "#")];
  if (template === undefined) return null;
  const numbers = text.match(NUMBER) ?? [];
  return template.replace(/\{(\d+)\}/g, (_, i: string) => d(numbers[Number(i)] ?? ""));
}

/** A data file's English sentence in Bangla, or unchanged if it isn't one we know. */
export function translateData(text: string): string {
  const exact = EXACT[text];
  if (exact !== undefined) return exact;
  const filled = fromTemplate(text);
  if (filled !== null) return filled;
  for (const p of PATTERNS) {
    const m = p.re.exec(text);
    if (m) return p.to(m);
  }
  return text;
}
