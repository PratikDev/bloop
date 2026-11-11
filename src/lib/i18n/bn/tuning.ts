// Bangla for the accessibility core, step 5 (en/tuning.ts). Drafts: listed in drafts.ts until a Bangla speaker checks
// them. Every number is a slot formatted in Bangla.
import type { tuningEn } from "../en/tuning";
import type { Translated } from "../types";

export const tuningBn: Translated<typeof tuningEn> = {
  "tuning.title": "ট্র্যাক ০: সুর মেলানো",
  "tuning.progress": (p: { n: string; total: string }) => `ধাপ ${p.n} / ${p.total}`,
  "tuning.intro": "শোনা শুরুর আগে জেনে নিন কোন শব্দের কী মানে, একটি একটি করে। পরের ধাপ চাপলে প্রতিটি বাজে; বাদ দিন চাপলে শেষ। সাহায্য থেকে আবার বাজানো যায়।",
  "tuning.reference": (p: { value: string }) => `রেফারেন্স সুর: ${p.value} ডিগ্রি সেলসিয়াস, সমুদ্রের মাপকাঠির মাঝামাঝি। আরামদায়ক ভলিউম ঠিক করুন।`,
  "tuning.oceanLow": (p: { value: string }) => `সমুদ্রের তাপমাত্রা, সবচেয়ে নিচের নোঙর: ${p.value} ডিগ্রি সেলসিয়াস। নিচু সুর।`,
  "tuning.oceanHigh": (p: { value: string }) => `সমুদ্রের তাপমাত্রা, সবচেয়ে ওপরের নোঙর: ${p.value} ডিগ্রি সেলসিয়াস। উঁচু সুর।`,
  "tuning.rainLow": (p: { value: string }) => `বৃষ্টি, সবচেয়ে নিচের নোঙর: ঘণ্টায় ${p.value} মিলিমিটার। ধীর ফোঁটা।`,
  "tuning.rainHigh": (p: { value: string }) => `বৃষ্টি, সবচেয়ে ওপরের নোঙর: ঘণ্টায় ${p.value} মিলিমিটার। দ্রুত ফোঁটা।`,
  "tuning.snow": (p: { value: string }) => `তুষারও একই নিয়মে বাজে, ঘণ্টার মতো: ঘণ্টায় ${p.value} মিলিমিটার।`,
  "tuning.nodata": "নীরবতা মানে তথ্য নেই: স্থল, বা কোনো মাপ নেই। এর মানে কখনো শূন্য নয়। এই টিক শব্দটি জানায় তথ্য কোথায় শেষ।",
  "tuning.grammar":
    "শব্দের ব্যাকরণ। সুরের উচ্চতা হলো সমুদ্রের তাপমাত্রা: উঁচু সুর মানে বেশি উষ্ণ। ছন্দ হলো বৃষ্টি: দ্রুত ফোঁটা মানে ভারী বৃষ্টি, ঘণ্টাধ্বনি মানে তুষার। জোরে-আস্তে কোনো তথ্য বহন করে না, তাই আরামদায়ক রাখুন। বাম-ডান দ্রাঘিমাংশ অনুসরণ করে।",
  "tuning.done": "সুর মেলানো শেষ। মানচিত্রে Enter চাপলে এখানকার মান, D চাপলে জায়গার বর্ণনা, H চাপলে সব কী-র তালিকা।",
  "tuning.next": "পরের ধাপ",
  "tuning.again": "আবার বাজান",
  "tuning.skip": "সুর মেলানো বাদ দিন",
  "tuning.finish": "শোনা শুরু করুন",
  "tuning.replay": "ট্র্যাক ০ (সুর মেলানো) আবার বাজান",

  "provenance.line": (p: { dataset: string; agency: string; kind: string; deg: string; km: string; time: string }) =>
    `${p.dataset}: ${p.agency}-এর ${p.kind}। প্রতিটি ঘর ${p.deg} ডিগ্রি চওড়া, বিষুবরেখায় প্রায় ${p.km} কিলোমিটার। এই ফ্রেম: ${p.time} UTC।`,
  "provenance.kind.measurement": "পর্যবেক্ষণ",
  "provenance.kind.model": "মডেল",
  "provenance.kind.inventory": "তালিকা",
  "key.shiftP.action": "এই রেকর্ড কোথা থেকে এসেছে, এক লাইনে শুনুন",
};
