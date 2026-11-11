// Bangla for the CV/ML listener-test tasks (en/cv-test.ts). Drafts: listed in drafts.ts until a Bangla speaker checks them.
import type { cvTestEn } from "../en/cv-test";
import type { Translated } from "../types";
import { cvReadBn } from "./cv-read";

const box = (id: string) => (cvReadBn["cv.box.name"] as (p: { id: string }) => string)({ id });

export const cvTestBn: Translated<typeof cvTestEn> = {
  "lt.q.chordVariety": (p: { a: string; b: string }) =>
    `আপনি সমুদ্রের দুটি দৃশ্য শুনবেন, প্রথমে ${box(p.a)}, তারপর ${box(p.b)}, প্রতিটি তার নিচু, মাঝের ও উঁচু তাপমাত্রা হিসেবে। কোন দৃশ্যে বৈচিত্র্য বেশি?`,
  "lt.q.chordGroups": "আপনি একটি দৃশ্যের সমুদ্র-তাপমাত্রার বিস্তার কর্ড হিসেবে শুনবেন। আপনি কি একটি দল শুনছেন, নাকি দুটি?",
  "lt.opt.one": "একটি দল",
  "lt.opt.two": "দুটি দল",
};
