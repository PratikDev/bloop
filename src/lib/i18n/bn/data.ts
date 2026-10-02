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
import { placeBn, PLACES_BN } from "./places";

const d = (s: string) => localDigits(s, "bn");

/** A number as the files write it: an optional sign (the true minus), digits, decimals. */
const NUMBER = /[+−]?\d+(?:\.\d+)?/g;

const HEMISPHERE: Record<string, string> = { N: "উত্তর", S: "দক্ষিণ", E: "পূর্ব", W: "পশ্চিম" };

const EXACT: Record<string, string> = {
  ...PLACES_BN,

  // Units (mapping.json rules).
  "°C": "°সে",
  "mm/h": "মিমি/ঘণ্টা",
  "mm/day": "মিমি/দিন",
  cm: "সেমি",
  "drops/s": "ফোঁটা/সেকেন্ড",
  "bells/s": "ঘণ্টাধ্বনি/সেকেন্ড",
  "drops per step": "প্রতি ধাপে ফোঁটা",
  "detections per day": "প্রতিদিন শনাক্তকরণ",
  "click strength": "ক্লিকের জোর",

  // Then vs Now (dhaka_then_now.json, firms.json).
  "Hotter, not wetter, and the water underground is falling.": "আরও গরম, বেশি ভেজা নয়, আর ভূগর্ভস্থ পানি কমছে।",
  "A popular reanalysis-based dataset disagreed with independent records at this location, so we checked before you heard it.":
    "একটি জনপ্রিয় রিঅ্যানালাইসিস-ভিত্তিক ডেটাসেট এই জায়গায় স্বাধীন রেকর্ডের সাথে মেলেনি, তাই আপনাকে শোনানোর আগে আমরা যাচাই করেছি।",
  "more erratic rain (not tested)": "বৃষ্টি আরও অনিয়মিত হয়েছে (পরীক্ষা করা হয়নি)",
  "Compare MODIS with MODIS only; single years are example years.": "MODIS-কে শুধু MODIS-এর সাথে তুলনা করুন; আলাদা আলাদা বছরগুলো উদাহরণ মাত্র।",

  // mapping.json: voice names still marked TODO there.
  "Heat: how unusual": "তাপ: কতটা অস্বাভাবিক",
  "Satellite whisper": "স্যাটেলাইটের ফিসফিস",
  "Extreme ping": "চরম মানের সংকেত",
  "Sonic identity": "সোনিক পরিচয়",

  // mapping.json: rules for every sound.
  "Master volume is capped: all voices together stay below full scale.": "মূল ভলিউমের একটি সীমা আছে: সব কণ্ঠ মিলেও পূর্ণ মাত্রার নিচে থাকে।",
  "A limiter on the master output is a safety net against sudden loud sounds.": "মূল আউটপুটে একটি লিমিটার হঠাৎ জোরালো শব্দ থেকে সুরক্ষা দেয়।",
  "Every voice can be muted or soloed.": "প্রতিটি কণ্ঠ মিউট বা সোলো করা যায়।",
  "Style or instrument choices may change timbre only, never the value-to-pitch or value-to-density rules.":
    "ধরন বা বাদ্যযন্ত্রের পছন্দ শুধু শব্দের রং বদলাতে পারে, মান-থেকে-সুর বা মান-থেকে-ঘনত্বের নিয়ম কখনো নয়।",
  "Silence means no data (land, dry, or no measurement), never zero.": "নীরবতা মানে তথ্য নেই (স্থলভাগ, শুকনো, বা পরিমাপ নেই), কখনো শূন্য নয়।",
  "Left-right position follows longitude: west is left, east is right.": "বাঁ-ডান অবস্থান দ্রাঘিমাংশ মেনে চলে: পশ্চিম বাঁয়ে, পূর্ব ডানে।",

  // mapping.json: silences.
  "Land or no data at this point.": "এই বিন্দুতে স্থলভাগ, বা তথ্য নেই।",
  "Dry, or no data at this point.": "এই বিন্দুতে শুকনো, বা তথ্য নেই।",
  "No snow, or no data at this point.": "এই বিন্দুতে তুষার নেই, বা তথ্য নেই।",
  "No value for that year.": "সেই বছরের কোনো মান নেই।",
  "No value for that step.": "সেই ধাপের কোনো মান নেই।",
  "No value for that date.": "সেই তারিখের কোনো মান নেই।",
  "No fire detections that day.": "সেদিন কোনো আগুন শনাক্ত হয়নি।",
  "Plays once when the cursor enters an area with no data; the area itself stays silent.": "কার্সর তথ্যহীন এলাকায় ঢুকলে একবার বাজে; এলাকাটি নিজে নীরব থাকে।",
  "Plays only after a spoken value.": "শুধু একটি মান পড়ে শোনানোর পরে বাজে।",
  "Plays once per request.": "প্রতি অনুরোধে একবার বাজে।",
  "A latitude band with no ocean data is a rest.": "যে অক্ষাংশ-বলয়ে সমুদ্রের তথ্য নেই, সেখানে বিরতি।",

  // mapping.json: notes.
  "Drop timing varies slightly so it sounds like real rain; the average rate always follows the rule. Legend points are our choice.":
    "আসল বৃষ্টির মতো শোনাতে ফোঁটার সময় একটু এদিক-ওদিক হয়; গড় হার সবসময় নিয়ম মেনে চলে। লেজেন্ডের বিন্দুগুলো আমাদের বেছে নেওয়া।",
  "Same density rule as rain; only the sound changes. Legend points are our choice.": "বৃষ্টির মতোই ঘনত্বের নিয়ম; শুধু শব্দটি আলাদা। লেজেন্ডের বিন্দুগুলো আমাদের বেছে নেওয়া।",
  "Not paired with an EIC frame: a long-term context record. The same pitch means a different temperature than in the ocean voice, so the sound is different on purpose.":
    "কোনো EIC ফ্রেমের সাথে জোড়া নয়: এটি দীর্ঘমেয়াদি প্রসঙ্গ-রেকর্ড। একই সুর এখানে সমুদ্রের কণ্ঠের চেয়ে ভিন্ন তাপমাত্রা বোঝায়, তাই শব্দটি ইচ্ছে করেই আলাদা।",
  "Our design choice (Anomaly Choir): consonant means close to normal, dissonant means unusual, not 'bad'. Warm and cold anomalies are treated the same. Detune amounts are starting values. Shares the heat voice's volume budget.":
    "আমাদের নকশাগত সিদ্ধান্ত (অ্যানোমালি কয়্যার): সুরেলা মানে স্বাভাবিকের কাছাকাছি, বেসুরো মানে অস্বাভাবিক, ‘খারাপ’ নয়। উষ্ণ ও শীতল বিচ্যুতি একইভাবে ধরা হয়। ডিটিউনের পরিমাণগুলো প্রাথমিক মান। তাপের কণ্ঠের ভলিউম-সীমা ভাগ করে নেয়।",
  "Not paired with an EIC frame: a long-term context record.": "কোনো EIC ফ্রেমের সাথে জোড়া নয়: এটি দীর্ঘমেয়াদি প্রসঙ্গ-রেকর্ড।",
  "Our design choice, so silence over land is not mistaken for the app freezing.": "আমাদের নকশাগত সিদ্ধান্ত, যাতে স্থলভাগের নীরবতাকে অ্যাপ আটকে যাওয়া বলে ভুল না হয়।",
  "The caption names the dataset and mission that measured the value.": "ক্যাপশনে সেই ডেটাসেট ও মিশনের নাম থাকে, যা মানটি মেপেছে।",

  // mapping.json: timbres.
  "Warm sine with a soft attack and a smooth glide": "নরম শুরু আর মসৃণ গ্লাইডসহ উষ্ণ সাইন তরঙ্গ",
  "Short band-passed noise bursts, like raindrops; slightly louder as rain gets heavier": "বৃষ্টির ফোঁটার মতো ছোট ব্যান্ড-পাস নয়েজের ঝলক; বৃষ্টি ভারী হলে একটু জোরে",
  "Soft bell (sine partials, slow decay)": "নরম ঘণ্টা (সাইন পার্শিয়াল, ধীরে মিলিয়ে যায়)",
  "Triangle wave through a low-pass filter (deliberately different from the ocean sine)": "লো-পাস ফিল্টারের ভেতর দিয়ে ত্রিভুজ তরঙ্গ (ইচ্ছে করেই সমুদ্রের সাইন থেকে আলাদা)",
  "Rain drops, a fixed number per step": "বৃষ্টির ফোঁটা, প্রতি ধাপে নির্দিষ্ট সংখ্যায়",
  "Percussive click": "তালবাদ্যের মতো ক্লিক",
  "Slow pad": "ধীর প্যাড",
  "Soft two-note chime": "দুই নোটের নরম চাইম",
  "One short bright tone at the extreme point's position": "চরম বিন্দুর অবস্থানে একটি ছোট উজ্জ্বল সুর",
  "Four soft bell-sine notes": "চারটি নরম ঘণ্টা-সাইন নোট",

  // mapping.json: the heat deviation bands.
  "close to normal": "স্বাভাবিকের কাছাকাছি",
  "a little unusual": "একটু অস্বাভাবিক",
  unusual: "অস্বাভাবিক",
  "very unusual": "খুব অস্বাভাবিক",
};

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
  "not wetter": "বেশি ভেজা নয়।",
  wetter: "আরও ভেজা।",
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
    re: /^(.+), June–September: (not wetter|wetter|no clear change)\. GPCP ([+−]?\d+)% \((\d+)–(\d+) vs (\d+)–(\d+)\); rain gauges \(GPCC\) ([+−]?\d+)% \((\d+)–(\d+) vs (\d+)–(\d+)\)\.(?: Same GPCP and GPCC grid cells as (.+): this is the same record\.)?$/,
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
