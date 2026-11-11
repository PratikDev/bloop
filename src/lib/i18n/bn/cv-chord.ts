import type { cvChordEn } from "../en/cv-chord";
import type { Translated } from "../types";

export const cvChordBn: Translated<typeof cvChordEn> = {
  "cv.chord.toggle": "কর্ড: মানের বিস্তার",
  "cv.chord.two": (p: { a: string; pa: string; b: string; pb: string }) => `দুটি দল: ${p.a} (${p.pa} %) এবং ${p.b} (${p.pb} %)`,
  "cv.chord.one": (p: { a: string }) => `একটি দল, প্রায় ${p.a}`,
  "cv.chord.brief": (p: { count: string }) => `কর্ড: ${p.count}টি দল`,
  "cv.chord.briefOne": "কর্ড: ১টি দল",
  "cv.chord.relative": "আপেক্ষিক মান",
  "cv.chord.modesOnly": "এই রঙের পট্টির নিচের প্রান্ত গাঢ়, তাই কর্ড শুধু দলগুলো দেয়, সবচেয়ে কম মানগুলো নয়।",
  "cv.chord.block.pattern-only": "কর্ড বন্ধ: এই রেকর্ড শুধু নকশা, তাই কোনো মান পড়া হয়নি।",
  "cv.chord.block.not-allowlisted": "কর্ড বন্ধ: এই রেকর্ডের রঙের পট্টি বা ত্রুটি এটি অনুমতি দেয় না।",
  "cv.chord.block.both": "কর্ড বন্ধ: দুটোই মোডে আগে থেকেই দুটি তথ্যের স্বর বাজছে।",
  "cv.chord.block.duet": "কর্ড বন্ধ: একসুরে প্রমাণের দ্বৈত স্বরে আগে থেকেই দুটি তথ্যের স্বর বাজছে।",
  "cv.chord.block.no-data": "কর্ড বন্ধ: এই এলাকায় কোনো মান নেই।",
  "cv.chord.block.off": "কর্ড বন্ধ।",
  "cv.chord.atMeasure": "কর্ড চালু, কিন্তু বিজ্ঞান থেকে শিল্প ডায়াল মাপে আছে (সাধারণ সুর): মিশ্রণ আর সংগীতে এটি বাজে।",
  "cv.hwgt.chord.subject": "কর্ড",
  "cv.hwgt.chord.method":
    "মানগুলো আসে নাসার রঙের পট্টি উল্টে পড়া থেকে (প্যানেল যে মান পড়ে, সেগুলোই)। এদের হিস্টোগ্রাম রেকর্ডের মাপা ত্রুটির সমান চওড়া গাউসিয়ান দিয়ে মসৃণ করা হয়, আর সর্বোচ্চ ২টি দল রাখা হয় (প্রতিটি এলাকার অন্তত ৫ %)। প্রতিটি দল সুরের মতোই একই মান-থেকে-সুর নিয়মে নিজের মানে বাজে, বড় অংশ হলে জোরে, সুরের চেয়ে নিচু স্বরে।",
  "cv.hwgt.chord.unc": (p: { sigma: string }) => `মসৃণ করার প্রস্থ: মাপা ত্রুটি, ${p.sigma}। এর চেয়ে কাছের দলগুলো মিশে যায়।`,
};
