// Bangla for the credits list (draft, needs review: src/lib/i18n/bn/drafts.ts). Dataset names stay in English.

import type { creditsEn } from "../en/credits";
import type { Translated } from "../types";

export const creditsBn: Translated<typeof creditsEn> = {
  "credits.heading.data": "এই অ্যাপের ডেটা",
  "credits.heading.testing": "আমাদের পরীক্ষায় ব্যবহৃত (বাজানো যায় না)",
  "credits.testing.note": "আমাদের পাইপলাইন এগুলো তৈরি ও যাচাই করেছে; অ্যাপে এগুলোর কোনোটিই বাজে না।",
  "credits.group.observations": "পর্যবেক্ষণ",
  "credits.group.models": "মডেল ও রিঅ্যানালাইসিস",
  "credits.group.svs": "নাসার ভিজ্যুয়ালাইজেশন (SVS)",
  "credits.group.count": (p: { count: string }) => `${p.count}টি উৎস`,
  "credits.plays": (p: { pages: string }) => `যেখানে বাজে: ${p.pages}`,
  "credits.page.braille": "ব্রেইল এক্সপ্লোরার",
  "credits.link": (p: { name: string }) => `উৎসের পাতা: ${p.name}`,
  "credits.noLink": "লিংক পাওয়া যায়নি",
  "credits.power": "NASA POWER যাচাই করে বাদ দেওয়া হয়েছে: স্বাধীন রেকর্ডের সাথে মেলেনি।",
  "credits.loading": "ক্রেডিট লোড হচ্ছে",
  "credits.error": "ক্রেডিট লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন।",
};
