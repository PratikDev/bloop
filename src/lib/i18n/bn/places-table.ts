// Bangla for the table and places (en/places-table.ts). Drafts: listed in drafts.ts until a Bangla speaker
// checks them.
import type { placesTableEn } from "../en/places-table";
import { formatDegrees, formatUtc } from "../format";
import type { Translated } from "../types";

export const placesTableBn: Translated<typeof placesTableEn> = {
  "panel.table": "সারণি",
  "table.caption": (p: { record: string; unit: string; timeUtc: string; step: string }) =>
    `কার্সরের চারপাশে ${p.record}, ${p.unit} এককে, ${formatUtc(p.timeUtc, "bn")} UTC। সারিগুলো অক্ষাংশ, কলামগুলো দ্রাঘিমাংশ, ${p.step} ডিগ্রি পরপর; মাঝের ঘরটি কার্সর।`,
  "table.corner": "অক্ষাংশ ও দ্রাঘিমাংশ",
  "table.lat": (p: { lat: number }) => `${formatDegrees(p.lat, "bn")}° ${p.lat >= 0 ? "উ" : "দ"}`,
  "table.lon": (p: { lon: number }) => `${formatDegrees(p.lon, "bn")}° ${p.lon >= 0 ? "পূ" : "প"}`,
  "table.needle": "কার্সর",
  "table.dry": "শুকনো",
  "table.none": "তথ্য নেই",
  "table.unit.celsius": "ডিগ্রি সেলসিয়াস",
  "table.unit.mmPerHour": "মিলিমিটার প্রতি ঘণ্টা",
  "table.loading": "মানগুলো লোড হচ্ছে।",

  "places.open": "জায়গা খুঁজুন, বা মহাদেশ, দেশ ও বিভাগ থেকে বেছে নিন",
  "places.short": "জায়গা",
  "places.title": "জায়গা",
  "places.search": "জায়গা খুঁজুন",
  "places.searchHint": "শহর, দেশ, জেলা বা সাগর, বাংলা বা ইংরেজিতে।",
  "places.none": "কোনো জায়গা পাওয়া যায়নি।",
  "places.loading": "জায়গাগুলো লোড হচ্ছে।",
  "places.error": "জায়গাগুলো লোড হয়নি। স্থানাঙ্ক দিয়ে যাওয়া এখনও কাজ করে।",
  "places.browse": "অঞ্চল ধরে দেখুন",
  "places.goTo": (p: { name: string }) => `${p.name}-এ যান`,
  "places.moved": (p: { name: string }) => `${p.name}।`,

  "continent.asia": "এশিয়া",
  "continent.africa": "আফ্রিকা",
  "continent.europe": "ইউরোপ",
  "continent.northAmerica": "উত্তর আমেরিকা",
  "continent.southAmerica": "দক্ষিণ আমেরিকা",
  "continent.oceania": "ওশেনিয়া",
  "continent.antarctica": "অ্যান্টার্কটিকা",
  "continent.sevenSeas": "খোলা সমুদ্রের দ্বীপ",
};
