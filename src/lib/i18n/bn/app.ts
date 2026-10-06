// Bangla UI strings: shell, controls, map, readout (src/lib/i18n/en/app.ts).

import type { appEn } from "../en/app";
import { CREDIT_NAMES } from "../credits";
import { formatDegrees, formatInteger, formatRainRate, formatTemperature } from "../format";
import { translateData } from "./data";
import { PLACE_NAMES_BN, PLACES_BN } from "./places";

const deg = (v: number) => formatDegrees(v, "bn");
const int = (v: number) => formatInteger(v, "bn");
const ns = (lat: number) => (lat >= 0 ? "উত্তর" : "দক্ষিণ");
const ew = (lon: number) => (lon >= 0 ? "পূর্ব" : "পশ্চিম");

export const appBn: typeof appEn = {
  "app.title": "ব্লুপ",

  "start.lead": "নাসার চোখে সর্বশেষ সমুদ্র আর বৃষ্টি, শুনুন জীবন্ত শব্দে।",
  "start.hint": "হেডফোন থাকলে ভালো: পশ্চিম শোনা যায় বাঁ কানে, পূর্ব ডান কানে।",
  "start.button": "শোনা শুরু করুন",
  "start.silent": "শব্দ ছাড়া ঘুরে দেখুন",
  "start.silentHint": "মানগুলো লেখা আর ক্যাপশনে দেখাবে। যেকোনো সময় শব্দ চালু করতে পারবেন।",
  "start.loading": "সর্বশেষ সমুদ্রের ফ্রেম লোড হচ্ছে…",
  "start.skipIntro": "ভূমিকা বাদ দিন",

  "mode.explore": "ঘুরে দেখা",
  "mode.story": "ট্যুর",
  "mode.thenNow": "আগে বনাম এখন",

  "track.label": "যা শুনছেন",
  "track.ocean": "সমুদ্র",
  "track.rain": "বৃষ্টি",
  "track.both": "দুটোই",
  "track.oceanLong": "সমুদ্রের তাপমাত্রা",
  "track.rainLong": "বৃষ্টি ও তুষার",

  "settings.describe": "বর্ণনা",
  "settings.captions": "ক্যাপশন",
  "settings.builtInVoice": "বিল্ট-ইন কণ্ঠস্বর",
  "settings.reduceMotion": "অ্যানিমেশন কমান",
  "settings.language": "ভাষা",
  "settings.open": "সেটিংস",
  "lang.en": "English",
  "lang.bn": "বাংলা",

  "motif.play": "ব্লুপের সুর বাজান",
  "help.open": "সাহায্য",
  "help.keys": "কীবোর্ড",

  "badge.comingOctober": "অক্টোবরে আসছে",
  "badge.loadingRain": "বৃষ্টি লোড হচ্ছে…",

  "map.roleDescription": "শব্দ-মানচিত্র",
  "map.instructions": "তীর-কী চাপলে কার্সর ১ ডিগ্রি সরে, Shift সহ চাপলে ১০ ডিগ্রি। Enter চাপলে মান শোনা যায়। H চাপলে সব কী-র তালিকা।",
  "map.alt": (p: { reading: string; place: string; track: string }) => `${p.track}। ${p.reading}, অবস্থান ${p.place}।`,

  "place.latlon": (p: { lat: number; lon: number }) => `${deg(p.lat)}° ${ns(p.lat)}, ${deg(p.lon)}° ${ew(p.lon)}`,
  "place.spoken": (p: { lat: number; lon: number }) => `${deg(p.lat)} ডিগ্রি ${ns(p.lat)}, ${deg(p.lon)} ডিগ্রি ${ew(p.lon)}`,

  "place.Chattogram": PLACE_NAMES_BN.sweepCenter,
  "place.Dhaka": PLACES_BN.Dhaka,
  "place.Rajshahi": PLACES_BN.Rajshahi,
  "place.Sylhet": PLACES_BN.Sylhet,

  "unit.celsius": "°সে",
  "unit.mmPerHour": "মিমি/ঘণ্টা",
  "reading.oceanValue": (p: { valueC: number }) => `${formatTemperature(p.valueC, "bn")} °সে`,
  "reading.oceanNone": "এখানে সমুদ্রের তথ্য নেই",
  "reading.rainValue": (p: { mmPerHour: number; frozen: boolean }) => `${p.frozen ? "তুষার" : "বৃষ্টি"} ${formatRainRate(p.mmPerHour, "bn")} মিমি/ঘণ্টা`,
  "reading.dry": "শুকনো",
  "reading.rainNone": "এখানে বৃষ্টির তথ্য নেই",
  "reading.rainLoading": "বৃষ্টির তথ্য এখনো লোড হচ্ছে",

  "speak.ocean": (p: { valueC: number }) => `${formatTemperature(p.valueC, "bn")} ডিগ্রি সেলসিয়াস`,
  "speak.oceanNone": "এখানে সমুদ্রের তথ্য নেই",
  "speak.rain": (p: { mmPerHour: number; frozen: boolean }) => `${p.frozen ? "তুষার" : "বৃষ্টি"}, ঘণ্টায় ${formatRainRate(p.mmPerHour, "bn")} মিলিমিটার`,
  "speak.dry": "শুকনো",
  "speak.rainNone": "এখানে বৃষ্টির তথ্য নেই",
  "speak.approx": "প্রায় ",
  "speak.value": (p: { reading: string; place: string }) => `${p.reading}, অবস্থান ${p.place}।`,

  "frame.product.ocean": "সমুদ্রের তাপমাত্রা",
  "frame.product.rain": "বৃষ্টি ও তুষার",
  // Plan §16 "Frame label": a translation, to be checked by the team.
  "frame.label": (p: { product: string; datetime: string }) => `EIC ফ্রেম: ${p.product}, ${p.datetime} UTC। শব্দটি এই ফ্রেম থেকে সরাসরি তৈরি।`,

  "sound.pause": "শব্দ থামান",
  "sound.play": "শব্দ চালান",
  "sound.paused": "শব্দ থেমে আছে",
  "sound.resumed": "শব্দ চালু",
  "sound.muteAll": "সব মিউট",
  "sound.unmuteAll": "সব আনমিউট",
  "sound.stopped": "থেমেছে",
  "sound.turnOn": "শব্দ চালু করুন",
  "sound.offHint": "শব্দ বন্ধ আছে। শুনতে “শব্দ চালু করুন” বেছে নিন।",
  "mixer.label": "মিক্সার",
  "mixer.snow": "তুষার",
  "mixer.muteShort": "মিউট",
  "mixer.soloShort": "সোলো",
  "mixer.volume": (p: { voice: string }) => `${p.voice}: ভলিউম`,
  "mixer.mute": (p: { voice: string }) => `${p.voice}: মিউট`,
  "mixer.solo": (p: { voice: string }) => `${p.voice}: সোলো`,
  "sweep.play": "সুইপ বাজান",
  "sweep.needsRain": "বৃষ্টির তথ্য লোড হলে সুইপ শুরু হবে।",
  "timelapse.play": "ঝড়ের টাইম-ল্যাপস বাজান",
  "timelapse.stop": "টাইম-ল্যাপস থামান",
  "timelapse.loadingStart": "টাইম-ল্যাপসের ফ্রেম লোড হচ্ছে…",
  "timelapse.loading": (p: { loaded: number; total: number }) => `টাইম-ল্যাপস লোড হচ্ছে: ${int(p.total)}টির মধ্যে ${int(p.loaded)}টি ফাইল`,
  "timelapse.loadingShort": (p: { percent: number }) => `লোড হচ্ছে ${int(p.percent)}%`,
  "timelapse.error": "টাইম-ল্যাপসের ফ্রেম লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন।",
  "timelapse.announceStart": (p: { count: number; from: string; to: string }) =>
    `ঝড়ের টাইম-ল্যাপস: বৃষ্টির ${int(p.count)}টি ফ্রেম, ${p.from} থেকে ${p.to} UTC। কার্সর বাংলাদেশের কাছের সবচেয়ে ভারী বৃষ্টিকে অনুসরণ করে।`,
  "timelapse.frame": (p: { index: number; total: number }) => `টাইম-ল্যাপস ফ্রেম ${int(p.index)} / ${int(p.total)}`,
  "whisper.withRun": (p: { dataset: string; run: string }) => `${p.dataset}, ${p.run} রান`,
  "whisper.and": " ও ",
  "whisper.mission": (p: { agencies: string; mission: string; product: string; run: string | null }) =>
    `পরিমাপ করেছে ${p.agencies}-এর ${p.mission} স্যাটেলাইট (${p.product}${p.run ? `, ${p.run} রান` : ""})`,
  "whisper.dataset": (p: { maker: string; name: string; kind: string; analysis: boolean; run: string | null }) =>
    `${p.maker}-এর ${p.name} ${p.kind} ${p.analysis ? "বিশ্লেষণ" : "ডেটা"} থেকে${p.run ? ` (${p.run} রান)` : ""}`,
  "whisper.kind.sst": "সমুদ্রপৃষ্ঠের তাপমাত্রা",
  "whisper.kind.rain": "বৃষ্টি",
  "whisper.announce": (p: { text: string; source: string }) => `${p.text} উৎস: ${p.source}।`,
  "xray.unavailable": "এক্স-রে অক্টোবরে আসছে: এর জন্য নাসার কালারবার ডেটা লাগবে, যা এখনো প্রকাশিত হয়নি।",

  "announce.track": (p: { track: string }) => `এখন শুনছেন: ${p.track}।`,
  "announce.mode": (p: { mode: string }) => `${p.mode} মোড।`,
  "announce.toggle": (p: { name: string; on: boolean }) => `${p.name} ${p.on ? "চালু" : "বন্ধ"}।`,
  "announce.started": "শব্দ শুরু হয়েছে। কার্সর বঙ্গোপসাগরের ওপর। তীর-কী দিয়ে সরান।",

  // Plan §15: only the words around the names are translated.
  "credits.visualizations": `ভিজ্যুয়ালাইজেশন: ${CREDIT_NAMES.svs}, ${CREDIT_NAMES.eic}-এর জন্য।`,
  "credits.data": `এই অ্যাপের ডেটা: ${CREDIT_NAMES.data}।`,
  "credits.testing": `আমাদের পরীক্ষায় আরও ব্যবহৃত: ${CREDIT_NAMES.power} (বাদ দেওয়া হয়েছে: স্বাধীন রেকর্ডের সাথে মেলেনি)।`,

  "error.ocean": "সর্বশেষ সমুদ্রের ফ্রেম লোড করা যায়নি। সংযোগ দেখে পাতাটি রিলোড করুন।",
  "error.rain": "সর্বশেষ বৃষ্টির ফ্রেম লোড করা যায়নি। সমুদ্রের শব্দ চলবে; আবার চেষ্টা করতে পাতাটি রিলোড করুন।",

  "data.text": (p: { text: string }) => translateData(p.text),
};
