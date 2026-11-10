// Water's journey in Bangla: a developer's DRAFT.

import type { journeyEn } from "../en/art-journey";

export const journeyBn: Partial<typeof journeyEn> = {
  "journey.open": "জলের যাত্রা",
  "journey.title": "জলের যাত্রা: একটি বাংলাদেশ সুইট",
  "journey.lead":
    "বজ্রপাত, একটি বায়ুমণ্ডলীয় নদী, বাংলাদেশের ওপর বৃষ্টি, তার পাহাড়ে ভূমিধসের ঝুঁকি, তার নিচে জমা জল আর বঙ্গোপসাগর: প্রতিটি রেকর্ড তার পৃথিবী অর্কেস্ট্রা পরিবারে, ডায়াল সংগীতে (ডেটার কণ্ঠ অপরিবর্তিত), মাঝে দুই সেকেন্ডের নীরবতা।",
  "journey.play": "সুইটটি বাজান",
  "journey.stop": "থামান",
  "journey.close": "সুইটটি বন্ধ করুন",
  "journey.wav": "একটি টুকরো হিসেবে বাজান (WAV সংরক্ষণ)",
  "journey.wavDone": (p: { seconds: string; id: string }) => `সংরক্ষিত: ${p.seconds} সেকেন্ড, ছাপ ${p.id}।`,
  "journey.rendering": "সুইটটি রেন্ডার হচ্ছে",
  "journey.loading": "রেকর্ডগুলো লোড হচ্ছে",
  "journey.step.lightning": "বজ্রপাত",
  "journey.step.river": "একটি বায়ুমণ্ডলীয় নদী",
  "journey.step.rain": "বাংলাদেশের ওপর বৃষ্টি",
  "journey.step.slope": "বাংলাদেশের পাহাড়ে ভূমিধসের ঝুঁকি",
  "journey.step.water": "বাংলাদেশের নিচে জমা জল",
  "journey.step.sea": "বঙ্গোপসাগর",
  "journey.status.pattern only": "শুধু নকশা, কোনো মান নেই",
  "journey.status.relative": "আপেক্ষিক মান",
  "journey.status.verified": "নাসার ফাইলের সঙ্গে যাচাই করা মান",
  "journey.status.observation": "পর্যবেক্ষিত মান",
  "journey.status.model": "মডেল করা ঝুঁকির শ্রেণি (LHASA), দেখা ভূমিধস নয়; নিচের শ্রেণিগুলো বলে দেওয়া নীরবতা",
  "journey.line": (p: { name: string; dataset: string; period: string; status: string }) => `${p.name}। ${p.dataset}; ${p.period}; ${p.status}।`,
  "journey.dial": "ডায়াল সংগীতে: ডেটার কণ্ঠ অপরিবর্তিত; বদলায় বাদ্য, সা-তে স্থির সুর, স্বর ও মীড় আর হালকা প্রতিধ্বনি। ব্যাখ্যা, পরিমাপ নয়।",
  "journey.season": "শিল্পিত পছন্দ: ঋতুর রং (বর্ষা)।",
};
