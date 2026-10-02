// Bangla strings for the Inspector and How we know: checks, rules, provenance
// (src/lib/i18n/en/panels.ts).

import type { VoiceSpec } from "@/types/data-contract";
import type { panelsEn } from "../en/panels";
import { formatFixed, formatInteger, localDigits } from "../format";
import { ruleTextBn, voiceLabelBn } from "./rules";

const int = (v: number) => formatInteger(v, "bn");
const n2 = (v: number) => formatFixed(v, "bn", 2);

export const panelsBn: typeof panelsEn = {
  "panel.label": "এই শব্দ সম্পর্কে",
  "panel.truth": "যাচাই",
  "panel.mapping": "যা শুনছেন",
  "panel.provenance": "কোথা থেকে",

  "truth.intro": "আমরা প্রতিটি মান ফ্রেমের রং থেকে আবার পড়েছি, তারপর সেই মানগুলো নাসার মূল ডেটার সাথে মিলিয়ে দেখেছি।",
  "truth.ocean.heading": "সমুদ্রের তাপমাত্রা",
  "truth.ocean.updating": "যাচাই হালনাগাদ হচ্ছে",
  "truth.ocean.updatingNote": "সমুদ্রের কালারবার নতুন করে ক্যালিব্রেট করা হয়েছে; নতুন ত্রুটির মান দেখানোর আগে আলাদা একটি ফ্রেমে যাচাইয়ের অপেক্ষায় আছে।",
  // L1's templates, translated and filled from the JSON; pending until the team adopts them.
  "truth.ocean.sentence": (p: { lo: number; hi: number; legend: string; median: number; points: number }) =>
    `রঙের স্কেল NASA MUR SST-এর সাথে যাচাই করা: ফ্রেমের রং ${int(p.lo)}…${int(p.hi)} °সে-র সাথে মেলে ` +
    `(লেজেন্ডে লেখা ${localDigits(p.legend, "bn")})। মধ্যক ত্রুটি ${n2(p.median)} °সে (${int(p.points)}টি বিন্দু)।`,
  "truth.ocean.recheck": (p: { date: string; median: number }) => `${p.date}-এর ফ্রেমেও যাচাই করা হয়েছে: মধ্যক ত্রুটি ${n2(p.median)} °সে।`,
  "truth.rain.heading": "বৃষ্টি",
  "truth.rain.sentence": (p: { run: string; percent: number; points: number; oneFrame: boolean; allAgreed: boolean; agreedPct: number }) =>
    `NASA IMERG ${p.run} রানের সাথে যাচাই করা: সাধারণত ~${int(p.percent)}%-এর মধ্যে ` +
    `(বৃষ্টির ${int(p.points)}টি বিন্দু${p.oneFrame ? ", একটি ফ্রেম" : ""}); ` +
    (p.allAgreed ? "নমুনা নেওয়া প্রতিটি বিন্দুতে কোথায় বৃষ্টি হচ্ছিল, তা নিয়ে দুটি একমত।" : `নমুনা নেওয়া ${int(p.agreedPct)}% বিন্দুতে বৃষ্টি হচ্ছে কি না, তা নিয়ে দুটি একমত।`),
  "truth.rain.recheck": (p: { run: string }) => `সবচেয়ে নতুন ফ্রেমটিও IMERG ${p.run}-এর সাথে যাচাই করা হয়েছে এবং উতরে গেছে।`,
  "truth.rain.plotAlt": "বিক্ষেপ চিত্র: EIC ফ্রেম থেকে পড়া বৃষ্টির হার বনাম একই বিন্দুতে NASA IMERG, লগারিদমিক অক্ষে।",
  "truth.checkedOn": (p: { datetime: string }) => `যাচাই করা হয়েছে ${p.datetime} UTC`,
  "truth.rain.plotCaption": (p: { run: string; points: number }) => `ওপরের যাচাই, চিত্রে (IMERG ${p.run} রান, ${int(p.points)}টি বিন্দু)।`,

  "globe.teaser": "টিজার: অক্টোবরে আসছে",
  "globe.plan": "নাগরিক পর্যবেক্ষক বনাম স্যাটেলাইট: দুটি দৃষ্টিভঙ্গি, ঠিক বনাম ভুল নয়।",
  "globe.featured": (p: { date: string; lat: number; lon: number; ground: number; satellite: number; reports: number }) =>
    `একটি সাধারণ দিন: ${p.date} তারিখে ${formatFixed(p.lat, "bn", 2)}° উত্তর, ${formatFixed(p.lon, "bn", 2)}° পূর্বের কাছে মাটিতে থাকা পর্যবেক্ষকেরা ` +
    `প্রায় ${int(p.ground)}% মেঘ দেখেছেন (${int(p.reports)}টি প্রতিবেদন); স্যাটেলাইট মেপেছে ${int(p.satellite)}%।`,
  "globe.summary": (p: { placeDays: number; median: number; within: number }) =>
    `বাংলাদেশের ${int(p.placeDays)}টি স্থান-দিনে দুটির সাধারণ পার্থক্য ${int(p.median)} পয়েন্ট, ` +
    `আর ${int(p.within)}% ক্ষেত্রে তারা একে অপরের ২৫ পয়েন্টের মধ্যে।`,

  "mapping.intro": "প্রতিটি শব্দ একটি লিখিত নিয়ম মেনে চলে। একই সংখ্যাগুলো শব্দ-ইঞ্জিন চালায়, তাই এই পাতা আর শব্দ কখনো আলাদা কথা বলে না।",
  "mapping.live": "মানচিত্রে যা শুনছেন",
  "mapping.thenNow": "আগে বনাম এখন-এ যা শুনছেন",
  "mapping.notPlayed": "লেখা আছে, কিন্তু এখনো বাজানো হয় না",
  "mapping.global": "সব শব্দের নিয়ম",
  "mapping.designChoice": "আমাদের নকশাগত সিদ্ধান্ত, শ্রোতাদের সাথে পরীক্ষা করা হবে",
  "mapping.silence": "নীরবতা",
  "mapping.source": "ডেটা",
  "mapping.hearLegend": "লেজেন্ড শুনুন",
  "mapping.status.verified": "মূল ডেটার সাথে যাচাই করা",
  "mapping.status.context": "প্রসঙ্গ-রেকর্ড",
  "mapping.status.designOnly": "শব্দ-সংকেত",
  "mapping.voiceLabel": (p: { voice: VoiceSpec }) => voiceLabelBn(p.voice),
  "mapping.rule": (p: { voice: VoiceSpec }) => ruleTextBn(p.voice),

  "provenance.at": (p: { place: string }) => `এই অবস্থানের মান কোথা থেকে এসেছে: ${p.place}।`,
  "provenance.value": "মান",
  "provenance.dataset": "ডেটাসেট",
  "provenance.visualization": "ভিজ্যুয়ালাইজেশন",
  "provenance.svs": (p: { id: number }) => `NASA SVS ${p.id}`,
  "provenance.frameTime": "ফ্রেমের সময়",
  "provenance.utc": (p: { datetime: string }) => `${p.datetime} UTC`,
  "provenance.check": "যাচাই",
  "provenance.checkIsLatest": (p: { datetime: string }) => `এই যাচাই সর্বশেষ ফ্রেমের (${p.datetime} UTC), দেখানো টাইম-ল্যাপস ফ্রেমের নয়।`,
};
