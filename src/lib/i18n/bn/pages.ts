// Bangla strings for the page shell (src/lib/i18n/en/pages.ts).

import type { pagesEn } from "../en/pages";
import { formatFixed, formatInteger } from "../format";
import { APP_NAME } from "../brand";

const int = (v: number) => formatInteger(v, "bn");

export const pagesBn: typeof pagesEn = {
  "app.skipToContent": "মূল অংশে যান",

  "nav.label": "পাতা",
  "nav.home": `${APP_NAME}, প্রথম পাতা`,
  "nav.listen": "শুনুন",
  "nav.thenNow": "আগে বনাম এখন",
  "nav.how": "আমরা কীভাবে জানি",
  "nav.howShort": "কীভাবে",

  "home.eyebrow": "নাসা আর্থ ইনফরমেশন সেন্টার · সর্বশেষ ফ্রেম",
  // The headline is "{lead} {accent}", the accent in colour.
  "home.titleLead": "শুনুন:",
  "home.titleAccent": "পৃথিবীর সর্বশেষ ফ্রেম।",
  "home.continue": "শোনা চালিয়ে যান",
  "home.stations": "শুরুর তিনটি পথ",
  "home.station.listen": "নাসার সর্বশেষ ফ্রেমের ওপর ঘুরে বেড়ান, আর কার্সরের নিচের সমুদ্র ও বৃষ্টি শুনুন।",
  "home.station.thenNow": "বাংলাদেশে তাপ, বর্ষার বৃষ্টি আর ভূগর্ভস্থ পানি কীভাবে বদলেছে, শুনুন।",
  "home.station.how": "প্রতিটি মান নাসার মূল ডেটার সাথে কীভাবে মিলিয়ে দেখা হয়েছে, আর শব্দের পেছনের প্রতিটি নিয়ম।",

  "opening.label": "ভূমিকা",
  "opening.escHint": "অথবা Esc চাপুন",

  "listen.title": "সর্বশেষ সমুদ্র ও বৃষ্টি, শব্দে",
  "listen.panel": "কার্সরের নিচে",
  "listen.hint": "অন্য জায়গা শুনতে মানচিত্রে ট্যাপ করুন বা টানুন, অথবা তীর-কী ব্যবহার করুন।",
  "listen.hintDismiss": "বুঝেছি",
  "tour.start": "ট্যুর শুরু করুন",
  "dock.short.sweep": "সুইপ",
  "dock.short.timelapse": "ঝড়",
  "dock.label.timelapse": "ঝড়ের টাইম-ল্যাপস",
  "dock.short.stop": "থামান",
  "dock.short.tour": "ট্যুর",
  "dock.short.mixer": "মিক্সার",
  "dock.short.inspector": "বিস্তারিত",
  "dock.short.goto": "যান",
  "goto.open": "একটি অক্ষাংশ ও দ্রাঘিমাংশে যান",
  "goto.title": "একটি জায়গায় যান",
  "goto.lat": "অক্ষাংশ",
  "goto.lon": "দ্রাঘিমাংশ",
  "goto.hint":
    "ডিগ্রিতে লিখুন। উত্তর ও পূর্ব ধনাত্মক, দক্ষিণ ও পশ্চিম ঋণাত্মক; অথবা উত্তর, দক্ষিণ, পূর্ব বা পশ্চিম (N, S, E, W) যোগ করুন। দুটো একসাথে পেস্ট করতে পারেন, যেমন ২৩.৮, ৯০.৪।",
  "goto.submit": "যান",
  "goto.badLat": "অক্ষাংশ −৯০ থেকে ৯০-এর মধ্যে একটি সংখ্যা (অথবা উত্তর বা দক্ষিণ যোগ করুন)।",
  "goto.badLon": "দ্রাঘিমাংশ −১৮০ থেকে ১৮০-এর মধ্যে একটি সংখ্যা (অথবা পূর্ব বা পশ্চিম যোগ করুন)।",
  "dock.label": "শব্দ",
  "mixer.limited": "মিক্সার: কিছু শব্দ মিউট বা সোলো করা আছে",
  "inspector.open": "এই শব্দ সম্পর্কে",
  "inspector.close": "বন্ধ করুন",

  "thenNow.pageLead": "বাংলাদেশ ও বিশ্বের জন্য নাসা ও সহযোগীদের কয়েক দশকের রেকর্ড, শব্দে।",
  "thenNow.view": "দেখার ধরন",
  "thenNow.view.compare": "দশক তুলনা",
  "thenNow.view.monthly": "মাসে মাসে",
  "thenNow.details": "বিস্তারিত",

  "how.lead": "আমরা প্রতিটি মান ফ্রেমের রং থেকে আবার পড়েছি, তারপর নাসার মূল ডেটার সাথে মিলিয়ে দেখেছি। প্রতিটি শব্দ একটি লিখিত নিয়ম মেনে চলে।",
  "how.ocean.figure": "NASA MUR SST-এর তুলনায় মধ্যক ত্রুটি",
  "how.ocean.value": (p: { median: number }) => `${formatFixed(p.median, "bn", 2)} °সে`,
  "how.rain.figure": "NASA IMERG থেকে সাধারণ পার্থক্য",
  "how.rain.value": (p: { percent: number }) => `~${int(p.percent)}%`,
  "how.rules.title": "শব্দের নিয়ম",
  "how.rules.figure": "শব্দ, প্রতিটি একটি লিখিত নিয়ম মেনে চলে",
  "how.rules.value": (p: { count: number }) => int(p.count),
  "how.globe.title": "মাটি বনাম স্যাটেলাইট",
  "how.globe.figure": "স্থান-দিনে দুটি মান একে অপরের ২৫ পয়েন্টের মধ্যে",
  "how.globe.value": (p: { percent: number }) => `${int(p.percent)}%`,
  "how.open": "পুরো যাচাই পড়ুন",
  "how.openRules": "সব নিয়ম দেখুন",
  "how.openGlobe": "টিজার পড়ুন",
  "how.credits": "কৃতজ্ঞতা",
  "how.keys": "কী ও প্রবেশযোগ্যতা",

  "notFound.title": "এখানে কোনো সংকেত নেই",
  "notFound.text": "এই পাতাটি নেই। সর্বশেষ ফ্রেমগুলো এখনো মানচিত্রে চালু আছে।",
  "notFound.back": "শুনুন পাতায় যান",
};
