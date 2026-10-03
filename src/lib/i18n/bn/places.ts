// Bangla place names: the app's own (the sweep centre) and every place the
// data files name (L1's cities and places.json).

import type { PLACE_NAMES_EN } from "../en/places";

export const PLACE_NAMES_BN: typeof PLACE_NAMES_EN = {
  sweepCenter: "চট্টগ্রাম",
};

export const PLACES_BN: Record<string, string> = {
  Dhaka: "ঢাকা",
  Chattogram: PLACE_NAMES_BN.sweepCenter,
  Rajshahi: "রাজশাহী",
  Sylhet: "সিলেট",
  Kolkata: "কলকাতা",
  Delhi: "দিল্লি",
  "Punjab (Ludhiana)": "পাঞ্জাব (লুধিয়ানা)",
  Karachi: "করাচি",
  Kathmandu: "কাঠমান্ডু",
  Beijing: "বেইজিং",
  Shanghai: "সাংহাই",
  Tokyo: "টোকিও",
  Jakarta: "জাকার্তা",
  Manila: "ম্যানিলা",
  Sydney: "সিডনি",
  Perth: "পার্থ",
  Auckland: "অকল্যান্ড",
  Tehran: "তেহরান",
  Riyadh: "রিয়াদ",
  "Aral Sea region (Nukus)": "আরল সাগর অঞ্চল (নুকুস)",
  "Cairo (Nile delta)": "কায়রো (নীলনদের বদ্বীপ)",
  "Sahel (Niamey)": "সাহেল (নিয়ামে)",
  Lagos: "লাগোস",
  Kinshasa: "কিনশাসা",
  Nairobi: "নাইরোবি",
  Johannesburg: "জোহানেসবার্গ",
  Madrid: "মাদ্রিদ",
  London: "লন্ডন",
  "Amsterdam (Rhine delta)": "আমস্টারডাম (রাইন বদ্বীপ)",
  Moscow: "মস্কো",
  Reykjavik: "রেইকিয়াভিক",
  "Svalbard (Longyearbyen)": "স্বালবার্ড (লংইয়ারবিন)",
  "West Greenland (Ilulissat)": "পশ্চিম গ্রিনল্যান্ড (ইলুলিসাত)",
  "New York": "নিউ ইয়র্ক",
  Phoenix: "ফিনিক্স",
  "California Central Valley (Fresno)": "ক্যালিফোর্নিয়ার সেন্ট্রাল ভ্যালি (ফ্রেজনো)",
  "New Orleans (Mississippi delta)": "নিউ অরলিন্স (মিসিসিপি বদ্বীপ)",
  "Mexico City": "মেক্সিকো সিটি",
  "Manaus (Amazon)": "মানাউস (অ্যামাজন)",
  Lima: "লিমা",
  "São Paulo": "সাও পাওলো",
  "Buenos Aires": "বুয়েনোস আইরেস",
};

/** A place's Bangla name, or the name as the file gives it. */
export const placeBn = (name: string): string => PLACES_BN[name] ?? name;
