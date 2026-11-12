// Bangla for src/lib/i18n/en/data.ts: the truth checks, proof in unison and the product credits. DRAFT, review first
// (audit A-bn, 2026-11-10): written by Session A for Pratik's review; names, organisations and dataset titles stay as
// in English. Every number is a parameter from a pipeline file, written in Bangla digits.

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { numParam } from "../en/captions";
import type { dataEn } from "../en/data";
import { formatFixed, formatInteger } from "../format";
import type { Translated } from "../types";

const c2 = (v: number) => formatFixed(v, "bn", 2);
const n1 = (v: number) => formatFixed(v, "bn", 1);
const int = (v: number) => formatInteger(v, "bn");

export const truthBn: Translated<typeof dataEn> = {
  "truth.anomaly.heading": "স্বাভাবিকের তুলনায় সমুদ্রের তাপমাত্রা",
  "truth.anomaly.error": "অস্বাভাবিকতার যাচাই লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন।",
  "truth.anomaly.sentence": (p) =>
    `NOAA Coral Reef Watch-এর সাথে মিলিয়ে দেখা সমুদ্রপৃষ্ঠের তাপমাত্রার অস্বাভাবিকতা: ${int(p.n)}টি বিন্দুর ${int(p.signPct)}%-এ একই দিক; ` +
    `${c2(Math.abs(p.offset))} °সে ${p.offset < 0 ? "বেশি শীতল" : "বেশি উষ্ণ"} দেখায় (ভিত্তিকাল আলাদা)।`,
  "truth.threeway.heading": "একই বিন্দুর তিনটি পাঠ",
  "truth.threeway.sentence": (p) =>
    `${int(p.n)}টি বিন্দুতে নাসার GIBS মানচিত্র-স্তর ও MUR ফাইলের মধ্যমা পার্থক্য ${c2(p.gibs)} °সে; ` +
    `EIC ছবি ও MUR ফাইলের ${c2(p.frame)} °সে। GIBS-এর ${int(p.decodePct)}% পিক্সেল থেকে মান পড়া যায়।`,
  "truth.unison.heading": "একসুরে প্রমাণ",
  "truth.unison.explain": (p) =>
    `দুটি সুর: একটি EIC ছবি থেকে, একটি নাসার ফাইল থেকে। বিট শোনা গেলে দুটো মেলেনি। ${c2(p.median)} °সে ≈ এক সেমিটোনের ${c2(p.semitones)} ভাগ।`,
  "truth.unison.play": "সবচেয়ে কাছের যাচাই করা বিন্দুটি শুনুন",
  "truth.unison.helix": (p) =>
    `প্রমাণের হেলিক্স: ফ্রেমের সুতো আর ফাইলের সুতো সেকেন্ডে ${n1(p.beats)} বার একে অপরকে ঘিরে ঘোরে (মান মিললে দুটো এক হয়ে যায়)।`,
  "truth.unison.pair": (p) => `ফ্রেম ${c2(p.frame)} °সে, নাসার ফাইল ${c2(p.file)} °সে: সেকেন্ডে ${n1(p.beats)}টি বিট।`,
  "unison.say": (p) =>
    `সবচেয়ে কাছের যাচাই করা বিন্দু, ${int(p.km)} কিলোমিটার দূরে, ${p.place}। ফ্রেম ${c2(p.frame)} ডিগ্রি, ` +
    `নাসার ফাইল ${c2(p.file)} ডিগ্রি। আগে ফ্রেমের সুর, তারপর ফাইলের সুর যোগ হয়।`,
  "unison.loading": "যাচাই করা বিন্দুগুলো এখনো লোড হচ্ছে।",
  "caption.unison": (p: CaptionParams) =>
    `একসুরে প্রমাণ: ফ্রেম ${c2(numParam(p, "frame") ?? 0)} °সে, নাসার ফাইল ${c2(numParam(p, "file") ?? 0)} °সে, ` +
    `সেকেন্ডে ${n1(numParam(p, "beats") ?? 0)}টি বিট`,
  "credits.products": "এই অ্যাপের তথ্য",
  "key.u.action": "একসুরে প্রমাণ: সবচেয়ে কাছের যাচাই করা বিন্দুটি শুনুন (আগে EIC ফ্রেমের সুর, তারপর নাসার ফাইলের সুর)",
};
