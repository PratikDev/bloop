// Bangla strings for the page shell (src/lib/i18n/en/pages.ts).

import type { pagesEn } from "../en/pages";
import { formatFixed, formatInteger } from "../format";
import { APP_NAME } from "../brand";
import type { Translated } from "../types";

const int = (v: number) => formatInteger(v, "bn");

export const pagesBn: Translated<typeof pagesEn> = {
  "app.skipToContent": "মূল অংশে যান",

  "nav.label": "পাতা",
  "nav.home": `${APP_NAME}, প্রথম পাতা`,
  "nav.listen": "শুনুন",
  "nav.thenNow": "আগে বনাম এখন",
  "nav.how": "আমরা কীভাবে জানি",
  "nav.howShort": "কীভাবে",

  "home.title": "শুনুন পৃথিবীর সমুদ্র আর বৃষ্টি।",
  "home.continue": "শোনা চালিয়ে যান",
  "home.resetChoice": "শব্দের পছন্দ রিসেট করুন",
  "home.tour": "৯০ সেকেন্ডের ট্যুর নিন",
  "home.frameCaption": (p: { date: string }) => `নাসা EIC ফ্রেম: সমুদ্রের তাপমাত্রা, ${p.date}।`,

  "opening.label": "ভূমিকা",
  "opening.escHint": "অথবা Esc চাপুন",

  "listen.title": "সর্বশেষ সমুদ্র ও বৃষ্টি, শব্দে",
  "listen.hint": "অন্য জায়গা শুনতে মানচিত্রে ট্যাপ করুন বা টানুন, অথবা তীর-কী ব্যবহার করুন।",
  "listen.hintDismiss": "বুঝেছি",
  "dock.label.timelapse": "ঝড়ের টাইম-ল্যাপস",
  "dock.short.mixer": "মিক্সার",
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
  "dock.label": "প্লেয়ার",
  "mixer.limited": "মিক্সার: কিছু শব্দ মিউট বা সোলো করা আছে",
  "inspector.open": "উৎস ও যাচাই",
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
  "how.openGlobe": "প্রিভিউ পড়ুন",
  "how.credits": "কৃতজ্ঞতা",
  "how.keys": "কী ও প্রবেশযোগ্যতা",

  "notFound.title": "এখানে কোনো সংকেত নেই",
  "notFound.text": "এই পাতাটি নেই। সর্বশেষ ফ্রেমগুলো এখনো মানচিত্রে চালু আছে।",
  "notFound.back": "শুনুন পাতায় যান",
};
