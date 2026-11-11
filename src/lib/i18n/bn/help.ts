// Bangla strings for the Help dialog: the keyboard map (src/lib/i18n/en/help.ts).

import type { helpEn } from "../en/help";
import { PLACE_NAMES_BN } from "./places";
import type { Translated } from "../types";

export const helpBn: Translated<typeof helpEn> = {
  "help.title": "কী ও সাহায্য",
  "help.focusNote": "শব্দ-মানচিত্রে ফোকাস থাকলে অক্ষর-কীগুলো কাজ করে, যাতে স্ক্রিন রিডারের কী-র সাথে না মেলে। Esc সব জায়গায় কাজ করে।",
  "help.voiceNote": "স্ক্রিন রিডার ব্যবহার করলে বিল্ট-ইন কণ্ঠস্বর বন্ধ রাখতে পারেন: স্ক্রিন রিডার নিজেই মানগুলো পড়ে শোনায়।",
  "help.keyColumn": "কী",
  "help.actionColumn": "কী করে",
  "key.arrows": "তীর-কী",
  "key.arrows.action": "কার্সর ১ ডিগ্রি সরান (Shift সহ: ১০ ডিগ্রি)",
  "key.enter.action": "মান ও অবস্থান শুনুন",
  "key.space": "স্পেস",
  "key.space.action": "লাইভ শব্দ থামান বা আবার চালান",
  "key.s.action": `${PLACE_NAMES_BN.sweepCenter} থেকে চারদিকে সুইপ বাজান`,
  "key.123.action": "সমুদ্র, বৃষ্টি, বা দুটোই শুনুন",
  "key.m.action": "সব মিউট বা আনমিউট",
  "key.d.action": "বর্ণনা মোড চালু বা বন্ধ",
  "key.c.action": "ক্যাপশন চালু বা বন্ধ",
  "key.t.action": "আগে বনাম এখন",
  "key.l.action": "লেজেন্ড শুনুন (নমুনা শব্দ)",
  "key.p.action": "এই মান কোথা থেকে এসেছে",
  "key.x.action": "এক্স-রে: একটি রং কীভাবে সংখ্যা ও শব্দ হয় (এই সংস্করণে নেই)",

  "key.h.action": "এই সাহায্য খুলুন",
  "key.esc": "Esc",
  "key.esc.action": "সব শব্দ থামান ও প্যানেল বন্ধ করুন",
};
