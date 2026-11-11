// Bangla for compare, the sonar and the expedition log (en/expedition.ts). Drafts: listed in drafts.ts until a Bangla speaker
// checks them. Every number is a slot formatted in Bangla.
import type { expeditionEn } from "../en/expedition";
import type { Translated } from "../types";

export const expeditionBn: Translated<typeof expeditionEn> = {
  "compare.open": "কার্সরের জায়গায় দুটি তারিখ তুলনা করুন",
  "compare.short": "তুলনা",
  "compare.title": "দুটি তারিখ তুলনা",
  "compare.layer": "রেকর্ড",
  "compare.layer.heat": "স্থলের তাপমাত্রা, স্বাভাবিকের তুলনায়",
  "compare.layer.rain": "বৃষ্টি",
  "compare.layer.water": "ভূগর্ভের পানি",
  "compare.month": "মাস",
  "compare.yearA": "প্রথম বছর",
  "compare.yearB": "দ্বিতীয় বছর",
  "compare.play": "তুলনা করুন",
  "compare.loading": "মাসিক রেকর্ড লোড হচ্ছে।",
  "compare.error": "মাসিক রেকর্ড লোড হয়নি।",
  "compare.unit.heat": "ডিগ্রি সেলসিয়াস",
  "compare.unit.rain": "মিলিমিটার প্রতিদিন",
  "compare.unit.water": "সেন্টিমিটার পানি",
  "compare.said": (p: { record: string; place: string; a: string; aValue: string; b: string; bValue: string; unit: string }) =>
    `${p.record}, ${p.place}-এর চারপাশের ঘর। ${p.a}: ${p.aValue} ${p.unit}। ${p.b}: ${p.bValue} ${p.unit}।`,
  "compare.higher": (p: { diff: string; unit: string }) => `দ্বিতীয়টি ${p.diff} ${p.unit} বেশি।`,
  "compare.lower": (p: { diff: string; unit: string }) => `দ্বিতীয়টি ${p.diff} ${p.unit} কম।`,
  "compare.same": "দুটি একই।",
  "compare.none": (p: { record: string; place: string }) => `${p.record}: দুটি মাসের একটিতে ${p.place}-এর চারপাশের ঘরে তথ্য নেই।`,
  "compare.howBeats": "এক কানে দুটি সুর: যত দ্রুত কাঁপে, পার্থক্য তত বেশি।",
  "compare.howDrops": "বৃষ্টি ফোঁটা হয়ে বাজে: প্রথম মাস, তারপর দ্বিতীয়।",
  "caption.compare.pair": (p: { beats: string }) => `দুটি তারিখ, এক কান: সেকেন্ডে ${p.beats}টি কম্পন`,

  "sonar.warmest": "সবচেয়ে উষ্ণ",
  "sonar.wettest": "সবচেয়ে ভেজা",
  "sonar.start": (p: { what: string }) => `সোনার: কাছের ${p.what} জায়গা খোঁজা হচ্ছে। কার্সর কাছে গেলে পিং উঁচু ও দ্রুত হয়।`,
  "sonar.none": "সোনার: কাছে খোঁজার মতো কিছু নেই।",
  "sonar.arrived": (p: { what: string; value: string; place: string }) => `কাছের ${p.what} জায়গা পাওয়া গেছে: ${p.value}, ${p.place}।`,
  "sonar.stopped": "সোনার বন্ধ।",
  "key.n.action": "সোনার: কার্সরের কাছে সবচেয়ে উষ্ণ (সমুদ্র) বা ভেজা (বৃষ্টি) জায়গা খুঁজুন; আবার N চাপলে থামে",

  "log.open": "অভিযানের খাতা: এই সেশনে যা পাওয়া গেল",
  "log.short": "খাতা",
  "log.title": "ব্লুপ অভিযানের খাতা",
  "log.empty": "এখনও কিছু নেই। Enter, D, তুলনা, জায়গা আর সোনার এতে যোগ করে।",
  "log.sources": "উৎস:",
  "log.download": "টেক্সট হিসেবে সংরক্ষণ (.txt)",
  "log.width": (p: { width: string }) => `প্রতিটি লাইন ${p.width} অক্ষর চওড়া, ব্রেইল এক্সপ্লোরারের মাপ অনুযায়ী।`,
};
