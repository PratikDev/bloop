// Bangla captions for every sound event (src/lib/i18n/en/captions.ts).
// Labels the engine passes through (a window "1981–1990", a legend point)
// get Bengali digits or a data-text translation here.

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { numParam, strParam, type captionsEn } from "../en/captions";
import { formatInteger, formatMonth, formatRainRate, formatTemperature, localDigits } from "../format";
import { translateData } from "./data";
import { PLACE_NAMES_BN } from "./places";
import { APP_NAME } from "../brand";

const TRACK_NAMES: Record<string, string> = { ocean: "সমুদ্র", rain: "বৃষ্টি", snow: "তুষার" };
const TRACK_OF: Record<string, string> = { ocean: "সমুদ্রের", rain: "বৃষ্টির", snow: "তুষারের" };
const label = (p: CaptionParams, key: string) => localDigits(strParam(p, key), "bn");
const month = (p: CaptionParams, key: string) => formatMonth(strParam(p, key), "bn");

export const captionsBn: typeof captionsEn = {
  "caption.value": (p: CaptionParams) => {
    const v = numParam(p, "value") ?? 0;
    if (strParam(p, "track") === "ocean") return `সুর: ${formatTemperature(v, "bn")} °সে সমুদ্র`;
    if (strParam(p, "phase") === "dry") return "নীরব: এখানে শুকনো";
    const kind = strParam(p, "phase") === "frozen" ? "ঘণ্টাধ্বনি: তুষার" : "ফোঁটা: বৃষ্টি";
    return `${kind}, ${formatRainRate(v, "bn")} মিমি/ঘণ্টা`;
  },
  "caption.nodata": (p: CaptionParams) => `টিক, তারপর নীরবতা: এখানে ${TRACK_OF[strParam(p, "track")] ?? ""} কোনো তথ্য নেই`,
  "caption.sweep.start": `${PLACE_NAMES_BN.sweepCenter} থেকে চারদিকে সুইপ হচ্ছে`,
  "caption.sweep.end": "সুইপ শেষ",
  "caption.legend": (p: CaptionParams) => `লেজেন্ড, ${TRACK_NAMES[strParam(p, "voice")] ?? ""}: ${translateData(strParam(p, "label"))}`,
  "caption.legendUnavailable": "এই লেজেন্ড আগে বনাম এখন-এর সাথে আসবে",
  "caption.warmup.start": "ওয়ার্ম-আপ: নমুনা শব্দগুলো বাজার সময় আরামদায়ক ভলিউম ঠিক করুন",
  "caption.warmup.end": "ওয়ার্ম-আপ শেষ",
  "caption.motif": `${APP_NAME}-এর সুর: চারটি নোট, দক্ষিণ থেকে উত্তরে সমুদ্রের প্রতিটি অক্ষাংশ-বলয়ের জন্য একটি`,
  "caption.opening.closeEyes": "চোখ বন্ধ করুন।",
  "caption.opening.openEyes": "এবার চোখ খুলুন।",
  "caption.stopped": "সব শব্দ থেমেছে",
  "caption.earcon.nodata": "টিক: এখানে তথ্য নেই",
  "caption.earcon.whisper": (p: CaptionParams) => `চাইম: ${strParam(p, "source")}`,
  "caption.earcon.ping": "পিং: দৃশ্যমান অংশের চরম মান",
  // Then vs Now: the data file's caption, translated (src/lib/i18n/bn/data.ts).
  "caption.thenNow.caption": (p: CaptionParams) => translateData(strParam(p, "text")),
  "caption.thenNow.window": (p: CaptionParams) => `বাজছে ${label(p, "label")}`,
  "caption.thenNow.end": "আগে বনাম এখন শেষ",
  "caption.water.gap": (p: CaptionParams) => {
    const from = month(p, "from");
    const to = month(p, "to");
    return from === to ? `নীরবতা: ${from}-এর কোনো স্যাটেলাইট পরিমাপ নেই` : `নীরবতা: কোনো স্যাটেলাইট পরিমাপ নেই, ${from} থেকে ${to}`;
  },
  "caption.water.windowStart": (p: CaptionParams) => `তুলনার সময়সীমা শুরু: ${month(p, "month")}`,
  "caption.water.windowEnd": (p: CaptionParams) => `তুলনার সময়সীমা শেষ: ${month(p, "month")}`,
  "caption.compare.side": (p: CaptionParams) => `এখন বাজছে: ${label(p, "label")}`,
  "caption.compare.useHeadphones": (p: CaptionParams) => `${label(p, "a")} বাঁ কানে, ${label(p, "b")} ডান কানে। হেডফোন থাকলে ভালো।`,
  "caption.timelapse.start": (p: CaptionParams) => {
    const count = numParam(p, "count");
    return `ঝড়ের টাইম-ল্যাপস: ${count === null ? "" : formatInteger(count, "bn")}টি ফ্রেম; কার্সর কাছের সবচেয়ে ভারী বৃষ্টিকে অনুসরণ করে`;
  },
  "caption.timelapse.peak": (p: CaptionParams) =>
    `এই টাইম-ল্যাপসে সবচেয়ে ভারী ${strParam(p, "phase") === "frozen" ? "তুষার" : "বৃষ্টি"}: ${formatRainRate(numParam(p, "value") ?? 0, "bn")} মিমি/ঘণ্টা`,
  "caption.timelapse.end": "টাইম-ল্যাপস শেষ",
  "caption.history.end": "ইতিহাস শেষ",
  "caption.speech": (p: CaptionParams) => strParam(p, "text"),
  "caption.noBanglaVoice": "এই ডিভাইসে বাংলা কণ্ঠস্বর নেই, তাই মান দেখানো হচ্ছে কিন্তু পড়ে শোনানো হচ্ছে না",
  "caption.noSpeech": "এই ব্রাউজার কথা বলতে পারে না; তাই মান দেখানো হচ্ছে",
};
