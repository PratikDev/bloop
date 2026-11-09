// Bangla strings for the record rack, the mini player, the needle sliders and the cabinet (src/lib/i18n/en/records.ts). Drafts, for review.

import type { recordsEn } from "../en/records";
import { formatFixed, formatInteger } from "../format";
import type { Translated } from "../types";

const lonWord = (lon: number) => (lon < 0 ? "পশ্চিম" : "পূর্ব");
const latWord = (lat: number) => (lat < 0 ? "দক্ষিণ" : "উত্তর");
const withPlace = (text: string, place?: string | null) => (place ? `${text}, ${place}` : text);

export const recordsBn: Translated<typeof recordsEn> = {
  "records.label": "রেকর্ড",
  "records.heading": "একটি রেকর্ড বাছুন",
  "records.group.A": "সরাসরি ফ্রেম",
  "records.group.B": "আগে বনাম এখন",
  "records.group.C": "অফিশিয়াল রেকর্ড",
  "records.group.D": "নির্দেশিত",
  "records.source.A": "নাসার EIC ফ্রেম, সরাসরি বাজানো",
  "records.source.B": "আগে বনাম এখনের রেকর্ড",
  "records.source.C": "নাসার EIC ও SVS রেকর্ড",
  "records.source.D": "নির্দেশিত শোনা",
  "records.count": (p: { count: number }) => `${formatInteger(p.count, "bn")}টি রেকর্ড`,
  "records.legend.title": "কেমন শোনায়",
  "records.legend.subtitle": "উষ্ণ, শীতল, বৃষ্টি ও তুষার শুনুন",
  "records.both.title": "সমুদ্র ও বৃষ্টি একসাথে",
  "records.tour.title": "ট্যুর",
  "records.sweep.title": "চট্টগ্রাম থেকে সুইপ",
  "records.live": "সরাসরি",
  "records.chartOnly": "শুধু চার্ট",
  "records.frames": (p: { count: number }) => `${formatInteger(p.count, "bn")}টি ফ্রেম`,
  "records.allOfficial": "সব অফিশিয়াল রেকর্ড",
  "records.startHere": "এখান থেকে শুরু",
  "records.hint.legend": "নতুন? আগে A0 বাজিয়ে শব্দগুলো চিনে নিন।",
  "records.code": "রেকর্ড কোড",
  "records.code.placeholder": "যেমন B2",
  "records.code.play": "বাজান",
  "records.code.none": (p: { code: string }) => `${p.code} নামে কোনো রেকর্ড নেই`,
  "records.nowPlaying": (p: { code: string; title: string }) => `এখন বাজছে ${p.code}, ${p.title}`,

  "records.kind.model": "মডেল",
  "records.kind.reanalysis": "পুনর্বিশ্লেষণ",
  "records.kind.observation": "পর্যবেক্ষণ",

  "player.nowPlaying": "এখন বাজছে",
  "player.previous": "আগের রেকর্ড",
  "player.next": "পরের রেকর্ড",

  "needle.group": "সুই সরান",
  "needle.westEast": "পশ্চিম থেকে পূর্ব",
  "needle.southNorth": "দক্ষিণ থেকে উত্তর",
  "needle.w": "প",
  "needle.e": "পূ",
  "needle.s": "দ",
  "needle.n": "উ",
  "needle.lonValue": (p: { lon: number; place?: string | null }) => withPlace(`${formatFixed(Math.abs(p.lon), "bn", 1)}° ${lonWord(p.lon)}`, p.place),
  "needle.latValue": (p: { lat: number; place?: string | null }) => withPlace(`${formatFixed(Math.abs(p.lat), "bn", 1)}° ${latWord(p.lat)}`, p.place),

  "skip.map": "মানচিত্রে যান",
  "skip.records": "রেকর্ডে যান",
  "skip.player": "প্লেয়ারে যান",

  "listen.howChecked": "আমরা কীভাবে যাচাই করেছি",

  "tube.ocean": (p: { value: string; min: string; max: string }) => `সমুদ্রের মাত্রা: ${p.value} °সে, এই ফ্রেমের ${p.min} থেকে ${p.max} °সে সীমায়`,
  "tube.rain": (p: { value: string; min: string; max: string }) => `বৃষ্টির মাত্রা: ${p.value} মিমি/ঘণ্টা, এই ফ্রেমের ${p.min} থেকে ${p.max} মিমি/ঘণ্টা লগ স্কেলে`,
  "tube.ocean.none": "সমুদ্রের মাত্রা: এখানে কোনো মান নেই",
  "tube.rain.none": "বৃষ্টির মাত্রা: শুকনো বা এখানে কোনো মান নেই",
};
