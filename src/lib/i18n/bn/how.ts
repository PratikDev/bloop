import type { howEn } from "../en/how";
import type { Translated } from "../types";

export const howBn: Translated<typeof howEn> = {
  "how.notAvailable": "পাওয়া যায়নি",
  "how.viewTable": "সারণি হিসেবে দেখুন",
  "how.hideTable": "সারণি লুকান",
  "how.oneToOne": "১:১ রেখা: পুরোপুরি মিল",
  "how.col.lat": "অক্ষাংশ",
  "how.col.lon": "দ্রাঘিমাংশ",
  "how.col.date": "তারিখ",
  "how.col.frameC": "ফ্রেম থেকে পড়া (°সে)",
  "how.col.murC": "MUR ফাইল (°সে)",
  "how.col.frameMmh": "ফ্রেম থেকে পড়া (মিমি/ঘণ্টা)",
  "how.col.imergMmh": "IMERG ফাইল (মিমি/ঘণ্টা)",
  "how.col.groundPct": "মাটির পর্যবেক্ষক (% মেঘ)",
  "how.col.satellitePct": "স্যাটেলাইট (% মেঘ)",
  "how.col.sound": "শব্দ",
  "how.col.rule": "নিয়ম",
  "how.ocean.numbers": (p: { median: string; p90: string; n: string; rho: string; date: string; source: string }) =>
    `মধ্যমা ত্রুটি ${p.median} °সে; ৯০% বিন্দু ${p.p90} °সে-এর মধ্যে; n = ${p.n}। সর্বশেষ ফ্রেম যাচাই ${p.date}: ${p.source}-এর সাথে ρ = ${p.rho}।`,
  "how.ocean.explain": (p: { n: string }) =>
    `আমরা EIC ফ্রেমের রং থেকে ${p.n}টি জায়গায় সমুদ্রের তাপমাত্রা ফিরে পড়েছি এবং প্রতিটি একই জায়গায় নাসার MUR ফাইলের সাথে মিলিয়েছি। বিন্দুগুলো ১:১ রেখার ওপর: যে মান আমরা বাজাই তা নাসার ডেটারই মান, এক ডিগ্রির ভগ্নাংশ এদিক-ওদিক।`,
  "how.ocean.alt": (p: { n: string; rho: string; median: string }) =>
    `${p.n}টি বিন্দুর বিক্ষেপ-চিত্র: ফ্রেম থেকে পড়া সমুদ্রের তাপমাত্রা বনাম নাসার MUR ফাইল। বিন্দুগুলো ১:১ রেখার কাছে (ρ = ${p.rho}, মধ্যমা ত্রুটি ${p.median} °সে)।`,
  "how.rain.numbers": (p: { percent: string; n: string; agree: string; rho: string; date: string; source: string }) =>
    `সাধারণ পার্থক্য ~${p.percent}%; বৃষ্টি আছে কি নেই, তা ${p.agree}% বিন্দুতে মিলেছে; n = ${p.n}। সর্বশেষ ফ্রেম যাচাই ${p.date}: ${p.source}-এর সাথে ρ = ${p.rho}।`,
  "how.rain.explain":
    "যেখানে ফ্রেম ও নাসার IMERG ফাইল দুটোতেই বৃষ্টি আছে, সেখানে আমরা ফ্রেমের রং থেকে বৃষ্টির হার ফিরে পড়েছি এবং একই জায়গা ও আধা ঘণ্টায় মিলিয়েছি। রঙে ধাপ আছে, তাই মান কিছুটা আলাদা হয়, কিন্তু ফাইলে ভারী বৃষ্টি মানে আপনি যা শোনেন তাতেও ভারী বৃষ্টি।",
  "how.rain.alt": (p: { n: string; rho: string }) =>
    `লগ স্কেলে ${p.n}টি বৃষ্টির বিন্দুর বিক্ষেপ-চিত্র: ফ্রেম থেকে পড়া বৃষ্টির হার বনাম নাসার IMERG ফাইল। বিন্দুগুলো ১:১ রেখা মেনে চলে (ρ = ${p.rho})।`,
  "how.rules.numbers": (p: { count: string }) => `${p.count}টি শব্দ, প্রতিটির একটি লিখিত নিয়ম; পুরো তালিকা এক ক্লিক দূরে।`,
  "how.rules.explain":
    "প্রতিটি শব্দ শোনার আগেই লিখে রাখা একটি নিয়ম মানে: কোন সংখ্যা এটি চালায় আর কী বদলায়। কোনো মান না থাকলে নীরবতা, কখনো অনুমান নয়।",
  "how.globe.numbers": (p: { median: string; within: string; rho: string; n: string; source: string }) =>
    `মধ্যমা পার্থক্য ${p.median} পয়েন্ট; ${p.within}% স্থান-দিন ২৫ পয়েন্টের মধ্যে; ρ = ${p.rho}; n = ${p.n} স্থান-দিন (${p.source})।`,
  "how.globe.explain":
    "বাংলাদেশের স্বেচ্ছাসেবকেরা জানিয়েছেন আকাশ কতটা মেঘলা দেখাচ্ছিল; একটি আবহাওয়া স্যাটেলাইট একই জায়গা ও দিনে মেঘের আচ্ছাদন মেপেছে। প্রায়ই এরা আলাদা, কারণ একজন এক জায়গা থেকে ওপরে তাকান আর অন্যটি বড় এলাকা জুড়ে নিচে: দুটি দৃষ্টিভঙ্গি, ঠিক-ভুল নয়।",
  "how.globe.alt": (p: { n: string; rho: string }) =>
    `${p.n}টি স্থান-দিনের বিক্ষেপ-চিত্র: মাটির পর্যবেক্ষকের জানানো মেঘ বনাম স্যাটেলাইটের মাপা মেঘ। বিন্দুগুলো ১:১ রেখার চারপাশে ছড়ানো (ρ = ${p.rho})।`,
  "how.openGlobe": "পুরো তুলনা পড়ুন",
  "badge.skipped": "এই সংস্করণে বাদ",
};
