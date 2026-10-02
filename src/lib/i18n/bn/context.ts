// Bangla strings for Then vs Now and Month by month (src/lib/i18n/en/context.ts).
// Numbers are parameters from the JSON; labels made from the files ("1981–1990")
// get Bengali digits here.

import type { contextEn } from "../en/context";
import { formatFixed, formatInteger, formatYear, localDigits } from "../format";

const n1 = (v: number) => formatFixed(v, "bn", 1);
const n2 = (v: number) => formatFixed(v, "bn", 2);
const int = (v: number) => formatInteger(v, "bn");
const year = (v: number) => formatYear(v, "bn");
const d = (s: string) => localDigits(s, "bn");

export const contextBn: typeof contextEn = {
  "thenNow.contextNote": "এগুলো প্রসঙ্গ-রেকর্ড, EIC ফ্রেম নয়: বাংলাদেশের জন্য নাসা ও সহযোগীদের দীর্ঘমেয়াদি ডেটাসেট।",
  "thenNow.title": (p: { city: string }) => `${p.city}: আগে বনাম এখন`,
  "thenNow.city": "শহর",
  "thenNow.computed": "ঢাকার একই পদ্ধতিতে হিসাব করা। শুধু ঢাকার রেকর্ড স্বাধীন রেকর্ডের সাথে মিলিয়ে দেখা হয়েছে।",
  "thenNow.waterNational": "ভূগর্ভস্থ পানি একটি জাতীয় রেকর্ড (বাংলাদেশ বক্স), প্রতিটি শহরের জন্য একই।",
  "thenNow.crosscheckAlt":
    "ঢাকার দুটি চার্ট। ওপরে: ১৮৯০-এর দশক থেকে জুন–সেপ্টেম্বরের বৃষ্টি, বৃষ্টিমাপক যন্ত্র (GPCC), GPCP ও NASA POWER থেকে; POWER অন্য দুটির চেয়ে অনেক কম দেখায়। নিচে: এপ্রিল–মে-র দৈনিক সর্বোচ্চ তাপমাত্রা, NASA POWER ও একটি আবহাওয়া কেন্দ্র থেকে; POWER কেন্দ্রের চেয়ে বেশ বেশি দেখায়।",
  "thenNow.powerTitle": "এখানে কেন আমরা NASA POWER ব্যবহার করি না",
  "thenNow.listen": "শুনুন",
  "thenNow.noSound": "(এখনো শব্দ নেই)",
  "thenNow.parts": "অংশ",
  "thenNow.part.heat": "তাপ",
  "thenNow.part.monsoon": "বর্ষার বৃষ্টি",
  "thenNow.part.water": "ভূগর্ভস্থ পানি",
  "thenNow.play": "এই অংশ বাজান",
  "thenNow.playAll": "তাপ, বৃষ্টি ও পানি বাজান",
  "thenNow.split": "আগে বাঁ কানে, এখন ডান কানে",
  "thenNow.stop": "থামান",
  "thenNow.soundOff": "শব্দ বন্ধ আছে। এই তুলনা শুনতে শব্দ চালু করুন।",
  "thenNow.loading": "তুলনা লোড হচ্ছে…",
  "thenNow.error": "তুলনার ডেটা লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন।",
  "thenNow.then": (p: { label: string }) => `আগে, ${d(p.label)}`,
  "thenNow.now": (p: { label: string }) => `এখন, ${d(p.label)}`,
  "thenNow.unit.anomaly": "°সে বিচ্যুতি",
  "thenNow.unit.mmPerDay": "মিমি/দিন",
  "thenNow.unit.cm": "সেমি",
  "thenNow.summary.yearly": (p: { part: string; unit: string; thenLabel: string; thenMean: number; nowLabel: string; nowMean: number }) =>
    `${p.part}: ${d(p.thenLabel)} সময়ে গড় ${n2(p.thenMean)} ${p.unit}, ${d(p.nowLabel)} সময়ে গড় ${n2(p.nowMean)} ${p.unit}।`,
  "thenNow.water.played": "বাংলাদেশ (এটিই শুনছেন)",
  "thenNow.water.notPlayed": "উত্তর-পশ্চিম ভারত (তুলনার জন্য দেখানো, বাজানো হয় না)",
  "thenNow.box.Bangladesh": "বাংলাদেশ",
  "thenNow.box.NW_India": "উত্তর-পশ্চিম ভারত",
  "thenNow.water.shading": "ছায়া দেওয়া অংশ: দুটি তুলনার সময়সীমা, আর যে মাসগুলোতে কোনো স্যাটেলাইট পরিমাপ নেই।",
  "thenNow.water.summary": (p: { missing: number; from: string; to: string }) =>
    `বাংলাদেশে পানির মজুদ, মাসিক, ${p.from} থেকে ${p.to}; ${int(p.missing)} মাসের কোনো পরিমাপ নেই।`,

  "thenNow.moreTitle": "আরও রেকর্ড, আগে বনাম এখন",
  "thenNow.part.fires": "আগুন",
  "thenNow.part.vegetation": "গাছপালা",
  "field.soundOctober": "এই রেকর্ডের এখনো শব্দ নেই: অক্টোবরে আসছে",
  "field.place": "স্থান",
  "field.sources": "এই সংখ্যাগুলো কোথা থেকে এসেছে",
  "field.rule": "নিয়ম",
  "field.caveat": "সতর্কতা",
  "field.credit": "কৃতজ্ঞতা",
  "field.fires.region": "অঞ্চল",
  "field.fires.region.CHT_Bangladesh_MarApr": "পার্বত্য চট্টগ্রাম, মার্চ–এপ্রিল",
  "field.fires.region.Punjab_India_OctNov": "পাঞ্জাব (ভারত), অক্টোবর–নভেম্বর",
  "field.fires.unit": "প্রতিদিন আগুন",
  "field.fires.summary": (p: { place: string; thenYear: number; nowYear: number }) =>
    `প্রতিদিন শনাক্ত আগুন, ${p.place}, ${year(p.thenYear)} ও ${year(p.nowYear)}, একই MODIS সেন্সরে।`,
  // Plan §16 "Fires" wording, translated; the place and numbers from firms.json.
  "field.fires.caption": (p: { place: string; thenYear: number; thenTotal: number; nowYear: number; nowTotal: number }) =>
    `উদাহরণ বছর, একই সেন্সর (MODIS): ${p.place}: ${int(p.thenTotal)}টি আগুন (${year(p.thenYear)}) বনাম ${int(p.nowTotal)}টি (${year(p.nowYear)})।`,
  "field.veg.point": "স্থান",
  "field.veg.point.Sundarbans": "সুন্দরবন",
  "field.veg.point.Madhupur_forest": "মধুপুর বন",
  "field.veg.point.Dhaka_city_control": "ঢাকা শহর (তুলনার জন্য)",
  "field.veg.unit": "NDVI",
  "field.veg.summary": (p: { place: string; then: string; now: string }) =>
    `উদ্ভিদ সূচক (NDVI), ${p.place}, প্রতি ১৬ দিনে, ${d(p.then)} বনাম ${d(p.now)}।`,
  "field.veg.caption": (p: { place: string; then: string; thenMean: number; now: string; nowMean: number }) =>
    `${p.place}: গড় NDVI ${d(p.then)} সময়ে ${n2(p.thenMean)}, ${d(p.now)} সময়ে ${n2(p.nowMean)} (একটিমাত্র ২৫০ মিটার পিক্সেল)।`,

  "disclosure.title": "এই তুলনা কীভাবে করা হয়েছে",
  "disclosure.dataset": "ডেটাসেট",
  "disclosure.window": (p: { label: string; years: number }) => `${d(p.label)} (${int(p.years)} বছর)`,
  "disclosure.mean": (p: { value: number; unit: string }) => `গড় ${n2(p.value)} ${p.unit}`,
  "disclosure.spread": (p: { value: number; unit: string }) => `বছর-থেকে-বছর ব্যবধান ${n2(p.value)} ${p.unit}`,
  "disclosure.change": (p: { value: string }) => `পরিবর্তন: ${p.value}`,
  "disclosure.crossCheck": "যাচাই, বৃষ্টিমাপক যন্ত্র (GPCC, বাজানো হয় না)",
  "disclosure.box": (p: { name: string; a: number; b: number; windowA: string; windowB: string; trend: number }) =>
    `${p.name}: ${n2(p.a)} সেমি (${p.windowA}) → ${n2(p.b)} সেমি (${p.windowB}); প্রবণতা বছরে ${n2(p.trend)} সেমি`,
  "disclosure.gapNote": "ফাঁক",
  "disclosure.notClaimed": "যা আমরা দাবি করি না",
  "disclosure.pending": "দল চূড়ান্ত ভাষা অনুমোদন না করা পর্যন্ত এই ক্যাপশনটি ডেটা ফাইলের ভাষ্যের অনুবাদ।",

  "history.intro": "একটি স্থানের মাসিক রেকর্ড। মাসে মাসে শুনতে একটি দশক বেছে নিন, অথবা একটি মাস শুনতে চার্ট বরাবর টানুন।",
  "history.place": "স্থান",
  "history.metric": "রেকর্ড",
  "history.heat": "তাপ",
  "history.rain": "বৃষ্টি",
  "history.water": "পানি",
  "history.decade": "দশক",
  "history.decadeLabel": (p: { decade: number }) => `${year(p.decade)}-এর দশক`,
  "history.play": (p: { decade: number }) => `${year(p.decade)}-এর দশক বাজান`,
  "history.unit.heat": "°সে বিচ্যুতি",
  "history.unit.rain": "মিমি/দিন",
  "history.unit.water": "সেমি",
  "history.group.bangladesh": "বাংলাদেশ",
  "history.group.world": "বিশ্ব",
  "history.loadingWorld": "বিশ্বের জন্য এই রেকর্ড লোড হচ্ছে (কয়েক মেগাবাইট, শুধু প্রথমবার)…",
  "history.noValue": (p: { month: string }) => `${p.month}: কোনো পরিমাপ নেই (নীরবতা)`,
  "history.sharedCell": (p: { places: string }) => `এই ডেটাসেটে এটি আর ${p.places} একই গ্রিড সেলে: একটিই রেকর্ড, আলাদা স্থান নয়।`,
  "history.sharedRegion": (p: { places: string }) => `এই ডেটাসেটে এটি আর ${p.places} একই GRACE অঞ্চলে: একটিই রেকর্ড, আলাদা স্থান নয়।`,
  "history.cell": (p: { lat: number; lon: number }) =>
    `গ্রিড সেলের কেন্দ্র ${n1(Math.abs(p.lat))}° ${p.lat >= 0 ? "উত্তর" : "দক্ষিণ"}, ${n1(Math.abs(p.lon))}° ${p.lon >= 0 ? "পূর্ব" : "পশ্চিম"}`,
  "history.neighbour": "(সবচেয়ে কাছের স্থলভাগের সেল; স্থানটির নিজের সেলটি সমুদ্রে)",
  "history.nationalBox": "বাংলাদেশ জাতীয় বক্স (GRACE): পুরো দেশের জন্য একটি রেকর্ড, প্রতিটি শহরের জন্য একই।",
  "history.confidence.high": "বৃষ্টির নির্ভরযোগ্যতা: উচ্চ (এখানে GPCP স্বাধীন বৃষ্টিমাপক যন্ত্রের সাথে খুব মেলে)",
  "history.confidence.medium": "বৃষ্টির নির্ভরযোগ্যতা: মাঝারি (এখানে GPCP স্বাধীন বৃষ্টিমাপক যন্ত্রের সাথে মোটামুটি মেলে)",
  "history.confidence.low": "বৃষ্টির নির্ভরযোগ্যতা: কম (এখানে GPCP আর স্বাধীন বৃষ্টিমাপক যন্ত্র মেলে না)",
  "history.confidence.satellite-only": "বৃষ্টির নির্ভরযোগ্যতা: শুধু স্যাটেলাইট (এখানে মিলিয়ে দেখার মতো বৃষ্টিমাপক যন্ত্র নেই, যেমন সমুদ্রে)",
  "history.computed": "NASA GISTEMP / GPCP / GRACE থেকে ঢাকার একই পদ্ধতিতে হিসাব করা; আলাদাভাবে যাচাই করা হয়নি।",
  "history.summary": (p: { metric: string; place: string; from: string; to: string }) => `${p.metric}, ${p.place}, মাসিক, ${p.from} থেকে ${p.to}।`,
  "history.scrub": (p: { place: string }) => `চার্ট (${p.place}): একটি মাস শুনতে এর বরাবর টানুন, অথবা তীর-কী ব্যবহার করুন`,
  "history.monthValue": (p: { month: string; value: string; unit: string }) => `${p.month}: ${p.value} ${p.unit}`,
  "history.loading": "রেকর্ড লোড হচ্ছে…",
  "history.error": "রেকর্ড লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন।",
};
