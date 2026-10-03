// Bangla strings for the tour (src/lib/i18n/en/story.ts). Numbers arrive as
// params, read from L1's data files.

import type { storyEn } from "../en/story";
import { PLACE_NAMES_BN } from "./places";

const CENTER = PLACE_NAMES_BN.sweepCenter;

export const storyBn: typeof storyEn = {
  "story.heading": "ট্যুর",
  "story.step.hum": "সমুদ্রের গুঞ্জন",
  "story.step.sweep": `${CENTER} থেকে সুইপ`,
  "story.step.storm": "ঝড়ের টাইম-ল্যাপস",
  "story.step.whisper": "স্যাটেলাইটের ফিসফিস",
  "story.step.xray": "এক্স-রে",
  "story.step.truth": "আমরা কীভাবে জানি",
  "story.stop": "ট্যুর থামান",
  "story.replay": "আবার বাজান",
  "story.backToExplore": "মানচিত্রে ফিরুন",
  "story.source": (p: { source: string }) => `ডেটা: ${p.source}`,
  "story.stopped": "ট্যুর থেমেছে। মানচিত্রে ফেরা হলো।",

  "story.hum": (p: { reading: string }) => `শুনুন: নাসার সর্বশেষ ফ্রেমে উত্তর বঙ্গোপসাগর। ${p.reading}।`,
  "story.sweep": `এবার ${CENTER} থেকে সাগর জুড়ে একটি সুইপ। উষ্ণ পানি উঁচু সুরে বাজে; বৃষ্টি বাজে ফোঁটার মতো।`,
  "story.sweepNoSound": `${CENTER} থেকে সুইপ একটি শব্দ। শুনতে শব্দ চালু করুন।`,
  "story.storm": (p: { hours: string; minutes: string }) => `সবচেয়ে ভারী ঝড়ের আশপাশে ${p.hours} ঘণ্টার বৃষ্টি, প্রতি ফ্রেমে ${p.minutes} মিনিট।`,
  "story.stormNoSpan": "সবচেয়ে ভারী ঝড়ের আশপাশের বৃষ্টি, ফ্রেম ধরে ধরে।",
  "story.stormPeak": (p: { reading: string; datetime: string }) => `এর পথে সবচেয়ে ভারী: ${p.reading}, ${p.datetime} UTC।`,
  "story.stormFailed": "ঝড়ের ফ্রেম লোড করা যায়নি, তাই এই ধাপ বাদ দেওয়া হলো।",
  "story.whisper": (p: { reading: string }) => `ঝড়টি এখন যেখানে: ${p.reading}।`,
  "story.xraySkipped": "এক্স-রে অক্টোবরে আসছে: এটি নাসার কালারবার ডেটার অপেক্ষায়।",
  "story.truth": (p: { sentence: string }) => `আমরা কীভাবে জানি? ${p.sentence}`,
  "story.truthLoading": "বৃষ্টির তথ্য লোড হলে যাচাইয়ের প্যানেলে বৃষ্টির যাচাই দেখা যাবে।",
  "story.end": (p: { close: string }) => `এ ছিল একটি জায়গা। পৃথিবীর যেকোনো জায়গা শুনতে “${p.close}” বেছে নিন।`,
};
