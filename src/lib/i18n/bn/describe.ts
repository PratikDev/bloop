// Bangla templates for the layered descriptions (en/describe.ts), written in Bangla rather than translated word for
// word. Drafts: listed in drafts.ts until a Bangla speaker checks them. Every parameter is a slot already formatted in
// Bangla; the templates never type a digit (the digit-provenance test checks).
import type { describeEn } from "../en/describe";
import { formatDegrees } from "../format";
import type { Translated } from "../types";

type Where = { where: string };

export const describeBn: Translated<typeof describeEn> = {
  "describe.lat": (p: { lat: number }) => `${formatDegrees(p.lat, "bn")} ডিগ্রি ${p.lat >= 0 ? "উত্তর" : "দক্ষিণ"}`,
  "describe.ocean.what": (p: { time: string }) => `সমুদ্রপৃষ্ঠের তাপমাত্রা, ${p.time} UTC।`,
  "describe.ocean.here": (p: Where & { value: string }) => `এখানে, ${p.where}: ${p.value} ডিগ্রি সেলসিয়াস।`,
  "describe.ocean.hereNone": (p: Where) => `এখানে, ${p.where}: সমুদ্রের তথ্য নেই। এটি স্থল, বা তথ্যে ফাঁক।`,
  "describe.ocean.range": (p: { min: string; minWhere: string; max: string; maxWhere: string }) =>
    `পুরো মানচিত্রে সবচেয়ে ঠান্ডা ${p.min} ডিগ্রি, জায়গা: ${p.minWhere}। সবচেয়ে উষ্ণ ${p.max} ডিগ্রি, জায়গা: ${p.maxWhere}।`,
  "describe.ocean.bandEquator": "সবচেয়ে উষ্ণ পানি বিষুবরেখার কাছের একটি বলয়ে।",
  "describe.ocean.band": (p: { lat: string }) => `সবচেয়ে উষ্ণ পানি ${p.lat}-এর আশেপাশের একটি বলয়ে।`,
  "describe.ocean.toward": (p: { dir: string }) => `এখানকার চারপাশে, ${p.dir} দিকে পানি বেশি উষ্ণ।`,
  "describe.ocean.warmestHere": "এখানকার চারপাশে, ঠিক এখানেই পানি সবচেয়ে উষ্ণ।",
  "describe.ocean.even": "এখানকার চারপাশে পানির তাপমাত্রা প্রায় একই।",

  "describe.rain.what": (p: { time: string }) => `বৃষ্টি ও তুষার, ${p.time} UTC।`,
  "describe.rain.dry": (p: Where) => `এখানে, ${p.where}: শুকনো।`,
  "describe.rain.here": (p: Where & { value: string; frozen: boolean }) =>
    `এখানে, ${p.where}: ঘণ্টায় ${p.value} মিলিমিটার ${p.frozen ? "তুষার" : "বৃষ্টি"}।`,
  "describe.rain.hereNone": (p: Where) => `এখানে, ${p.where}: বৃষ্টির তথ্য নেই।`,
  "describe.rain.max": (p: { max: string; maxWhere: string }) => `মানচিত্রে সবচেয়ে ভারী বৃষ্টি ঘণ্টায় ${p.max} মিলিমিটার, জায়গা: ${p.maxWhere}।`,
  "describe.rain.allDry": "পুরো মানচিত্র শুকনো।",
  "describe.rain.toward": (p: { dir: string }) => `এখানকার চারপাশে, ${p.dir} দিকে বৃষ্টি সবচেয়ে বেশি।`,
  "describe.rain.heaviestHere": "এখানকার চারপাশে, ঠিক এখানেই বৃষ্টি সবচেয়ে বেশি।",
  "describe.rain.spread": "এখানকার চারপাশে বৃষ্টি ছড়িয়ে আছে।",
  "describe.rain.even": "এখানকার চারপাশে সব শুকনো।",
  "describe.rain.same": (p: { minutes: string }) => `${p.minutes} মিনিট আগের মতোই।`,
  "describe.rain.started": (p: { minutes: string }) => `গত ${p.minutes} মিনিটের মধ্যে শুরু হয়েছে।`,
  "describe.rain.stopped": (p: { minutes: string }) => `গত ${p.minutes} মিনিটের মধ্যে থেমেছে।`,
  "describe.rain.up": (p: { before: string; minutes: string }) => `${p.minutes} মিনিট আগের চেয়ে ভারী; তখন ছিল ঘণ্টায় ${p.before} মিলিমিটার।`,
  "describe.rain.down": (p: { before: string; minutes: string }) => `${p.minutes} মিনিট আগের চেয়ে হালকা; তখন ছিল ঘণ্টায় ${p.before} মিলিমিটার।`,

  "describe.meaning": "এর মানে কী",
  "describe.loading": "কার্সরের জায়গার বর্ণনা তৈরি হচ্ছে।",
  "describe.say": "বলুন",
  "describe.note": "মানচিত্রে D চাপলে এটি বলা হয়। কতটা বিস্তারিত, তা সেটিংস → বিস্তারিত থেকে ঠিক হয়।",
  "panel.describe": "বর্ণনা",
  "describe.meaning.ocean":
    "উষ্ণ সমুদ্রের পানি ওপরের বাতাসকে তাপ আর জলীয় বাষ্প দেয়। বঙ্গোপসাগরে ঘূর্ণিঝড় আর বর্ষার বৃষ্টির জ্বালানি এটাই। সমুদ্র স্বাভাবিকের চেয়ে উষ্ণ হলে ঝড় আরও শক্তিশালী হতে পারে।",
  "describe.meaning.rain":
    "এটি এখন পড়তে থাকা বৃষ্টি ও তুষার, মহাকাশ থেকে নাসার IMERG প্রায় প্রতি আধা ঘণ্টায় মাপে। উজানে ভারী বৃষ্টি কয়েক দিন পরে ভাটিতে বন্যা আনতে পারে। দীর্ঘ শুকনো সময় খেত আর খাবার পানির জন্য গুরুত্বপূর্ণ।",
};
