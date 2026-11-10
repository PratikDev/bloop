// A letter to the future in Bangla: a developer's DRAFT.

import type { letterEn, tourEn } from "../en/art-letter";

export const letterBn: Partial<typeof letterEn> = {
  "letter.title": "ভবিষ্যতের কাছে একটি চিঠি",
  "letter.leave": "একটি চিঠি রেখে যান",
  "letter.save": "চিঠিটি সংরক্ষণ করুন",
  "letter.close": "চিঠিটি বন্ধ করুন",
  "letter.head": (p: { place: string; date: string }) => `${p.place}, ${p.date}।`,
  "letter.ocean": (p: { value: string }) => `সমুদ্র-পৃষ্ঠ ${p.value}।`,
  "letter.rain": (p: { value: string }) => `বৃষ্টি ${p.value}।`,
  "letter.dry": "এখানে বৃষ্টি পড়ছে না।",
  "letter.by": (p: { source: string }) => `মেপেছে ${p.source}, পড়েছে ও যাচাই করেছে ব্লুপ।`,
  "letter.median": (p: { error: string }) => `মধ্যমা ত্রুটি ${p.error} ডিগ্রি।`,
  "letter.percent": (p: { percent: string }) => `সাধারণ পার্থক্য প্রায় ${p.percent}%।`,
  "letter.pattern": (p: { record: string }) => `${p.record}: শুধু নকশা; কোনো মান লেখা নেই।`,
  "letter.none": "এখানে কোনো মান নেই: স্থল, বা কোনো পরিমাপ নেই।",
  "letter.noValue": "কোনো মান লেখা নেই",
  "letter.field.date": "তারিখ",
  "letter.field.place": "স্থান",
  "letter.field.value": "মান",
  "letter.field.source": "উৎস",
  "letter.field.link": "লিংক",
  "letter.note": "শুধু মাপা মান: ফ্রেমের তারিখ, কাঁটার নিচের মান, আর তা কীভাবে যাচাই হয়েছে।",
  "letter.hwgt.subject": "চিঠি",
  "letter.hwgt.method": "কাঁটার নিচের মান, ফ্রেম থেকে সেই একই ফাংশনে পড়া যা শব্দ বাজায়; তারিখ ফ্রেমের; ত্রুটি রেকর্ডের যাচাই-লাইন থেকে।",
};

export const tourBn: Partial<typeof tourEn> = {
  "tour.data": (p: { source: string; period: string }) => `ডেটা: ${p.source}; ফ্রেম ${p.period}।`,
  "tour.dataSpan": (p: { source: string; from: string; to: string }) => `ডেটা: ${p.source}; ফ্রেম ${p.from} থেকে ${p.to}।`,
};
