import type { lifetimeEn } from "../en/art-lifetime";

export const lifetimeBn: Partial<typeof lifetimeEn> = {
  "lifetime.view": "আপনার জীবনকাল",
  "lifetime.title": "আপনার জীবনকালের গান",
  "lifetime.lead": "একটি জন্মসাল আর একটি শহর বেছে নিন: সেই বছর থেকে সর্বশেষ বছর পর্যন্ত শহরটির রেকর্ড শুনুন, বছরে একটি সুর। আপনার কোনো পছন্দ সংরক্ষণ করা হয় না।",
  "lifetime.born": "জন্মসাল",
  "lifetime.city": "শহর",
  "lifetime.play": "আপনার জীবনকাল বাজান",
  "lifetime.stop": "থামান",
  "lifetime.part.heat": "এপ্রিল থেকে মে মাসের গরম",
  "lifetime.part.rain": "জুন থেকে সেপ্টেম্বরের বৃষ্টি",
  "lifetime.part.water": "মাটির নিচে জমা জল (পুরো বাংলাদেশ)",
  "lifetime.unit.heat": "ডিগ্রি",
  "lifetime.unit.rain": "মিমি প্রতিদিন",
  "lifetime.unit.water": "সেমি",
  "lifetime.since": (p: { year: string; city: string }) => `${p.year} থেকে ${p.city}-এ:`,
  "lifetime.starts": (p: { year: string }) => `${p.year} থেকে`,
  "lifetime.rose": (p: { part: string; slope: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}) প্রতি দশকে ${p.slope} ${p.unit} বেড়েছে (৯৫% পরিসর ${p.lo} থেকে ${p.hi}): স্পষ্ট প্রবণতা।`,
  "lifetime.fell": (p: { part: string; slope: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}) প্রতি দশকে ${p.slope} ${p.unit} কমেছে (৯৫% পরিসর ${p.lo} থেকে ${p.hi}): স্পষ্ট প্রবণতা।`,
  "lifetime.unclear": (p: { part: string; slope: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}): কোনো স্পষ্ট প্রবণতা নেই (প্রতি দশকে ${p.slope} ${p.unit}, ৯৫% পরিসর ${p.lo} থেকে ${p.hi})।`,
  "lifetime.tooFew": (p: { part: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}): স্পষ্ট পরীক্ষার জন্য বছর খুব কম; মান ${p.lo} থেকে ${p.hi} ${p.unit}।`,
  "lifetime.notes": (p: { count: string }) => `${p.count}টি সুর, বছরে একটি, সেকেন্ডে চারটি।`,
  "lifetime.link": "এই গানের লিংক",
  "lifetime.linkNote": "লিংকে শুধু সাল আর শহর থাকে।",
  "lifetime.chart": (p: { part: string }) => `${p.part}, বছরে একটি বিন্দু`,
  "lifetime.hwgt.subject": "আপনার জীবনকালের প্রবণতা",
  "lifetime.hwgt.method":
    "প্রতিটি শহরের বার্ষিক সারি (যে ঋতুগুলো তখন বনাম এখন বাজায়) এবং প্রতিটি শুরুর বছরের জন্য হামেদ-রাও সংশোধনসহ মান-কেন্ডাল পরীক্ষা ও সেনের ঢাল, তার ৯৫% পরিসরসহ; p < 0.05 এবং পরিসরে 0 না থাকলেই প্রবণতাকে স্পষ্ট বলা হয়। pipeline/stats/lifetime_stats.py লেখে; অ্যাপ শুধু পড়ে।",
  "lifetime.hwgt.n": (p: { years: string }) => `${p.years} বছর`,
  "midi.download": "MIDI হিসেবে নামান",
  "midi.sheet": "মানের তালিকা নামান",
  "midi.note": (p: { range: string }) =>
    `মানুষ বাদকের জন্য: নিখুঁত উচ্চতা MIDI সুর আর পিচ বেন্ড (পরিসর ${p.range} সেমিটোন) হিসেবে, বছরে একটি সুর, সঙ্গে বছর, মান ও কম্পাঙ্কের তালিকা মিলিয়ে দেখার জন্য।`,
};
