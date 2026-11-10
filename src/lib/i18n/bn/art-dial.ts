// The Science to Art dial in Bangla: a developer's DRAFT, listed for review in docs/i18n/TO_TRANSLATE.md.

import type { dialEn, proofEn } from "../en/art-dial";

export const dialBn: Partial<typeof dialEn> = {
  "dial.change.timbre": "সুরের রং",
  "dial.change.ticks": "মৃদু মাপের টিক",
  "dial.change.bed": "নরম পটভূমি",
  "dial.change.chord": "মানের কর্ড",
  "dial.change.drone": "সা-তে স্থির সুর",
  "dial.change.reverb": "হালকা প্রতিধ্বনি",
  "dial.change.meend": "স্বর আর মীড়",
  "dial.label": "বিজ্ঞান থেকে শিল্প",
  "dial.stop.0": "মাপ",
  "dial.stop.0.5": "মিশ্রণ",
  "dial.stop.1": "সংগীত",
  "dial.stopHint.0": "০, মাপ",
  "dial.stopHint.0.5": "০.৫, মিশ্রণ",
  "dial.stopHint.1": "১, সংগীত",
  "dial.unchanged": "ডেটার কণ্ঠ: প্রতিটি অবস্থানে অপরিবর্তিত।",
  "dial.whatChanges": (p: { list: string }) => `যা বদলায়: ${p.list}।`,
  "dial.announce": (p: { stop: string }) => `ডায়াল: ${p.stop}, ডেটা অপরিবর্তিত`,
  "dial.chord.none": "মানের কর্ড: এই সংস্করণে নেই, তাই বাজে না।",
  "dial.chord.off": "মানের কর্ড: দুটি ডেটা-কণ্ঠে বন্ধ (দুটোই)।",
  "dial.chord.blocked": (p: { why: string }) => `মানের কর্ড: এখানে নীরব (${p.why})।`,
  "dial.chord.why.pattern-only": "শুধু নকশা, কোনো মান নেই",
  "dial.chord.why.not-allowlisted": "এই রঙের পট তালিকায় নেই",
  "dial.chord.why.both": "আগে থেকেই দুটি ডেটা-কণ্ঠ",
  "dial.chord.why.duet": "আগে থেকেই দুটি ডেটা-কণ্ঠ",
  "dial.chord.why.no-data": "এখানে কোনো মান নেই",
  "dial.chord.why.off": "বন্ধ",
  "dial.season": (p: { colour: string }) => `শিল্পিত পছন্দ: ঋতুর রং (${p.colour})। সা কখনো সরে না।`,
  "dial.season.monsoon": "বর্ষা, ভরাট ও গাঢ়",
  "dial.season.dry": "শুকনো মৌসুম, হালকা",
  "dial.artistic": "ব্যাখ্যা, পরিমাপ নয়: ডায়াল যা যোগ করে সবই আমাদের শিল্পিত পছন্দ।",
  "dial.check": "ডেটার কণ্ঠ যাচাই করুন",
  "dial.checking": "যাচাই চলছে: প্রতিটি অবস্থান রেন্ডার হচ্ছে",
  "dial.check.pass": (p: { cents: string; notes: string; stops: string }) =>
    `${p.stops}টি অবস্থানে একই ডেটা-কণ্ঠ: ${p.notes}টি সুর, সুরের উচ্চতায় সবচেয়ে বড় পার্থক্য ${p.cents} সেন্ট (সীমা ১), একই শুরু ও লয়।`,
  "dial.check.fail": (p: { cents: string }) => `যাচাই ব্যর্থ: ${p.cents} সেন্টের পার্থক্য। দয়া করে জানান।`,
  "dial.check.drops": (p: { onsets: string; stops: string }) => `${p.stops}টি অবস্থানে একই ফোঁটা: ${p.onsets}টি শুরু, একই সময়।`,
  "dial.check.none": "এখানে যাচাই করার মতো ডেটা-কণ্ঠ নেই।",
  "dial.hwgt.subject": "ডেটার কণ্ঠ যাচাই",
  "dial.hwgt.uncertainty": "এই রেন্ডারে পরিমাপ ০.১ সেন্টের অনেক নিচে নির্ভুল; সীমা ১ সেন্ট।",
  "dial.hwgt.n": (p: { notes: string }) => `প্রতি অবস্থানে ${p.notes}টি সুর`,
  "dial.braille": (p: { stop: string }) => `ডায়াল: ${p.stop}, ডেটা অপরিবর্তিত`,
  "dial.hwgt.method":
    "রেকর্ডের নিজের মানগুলো তার নিয়মে বাজিয়ে অফলাইনে (OfflineAudioContext) রেন্ডার করা হয়: শিল্প-স্তর বন্ধ রেখে, তারপর ০, ০.৫ আর ১-এ। ডেটার কণ্ঠ আলাদা চ্যানেলে রেন্ডার হয়; প্রতিটি সুরের থিতু উচ্চতা অডিও থেকে মাপা হয় (জানালা-করা বর্ণালির সূক্ষ্ম খোঁজ) এবং শিল্প-বন্ধ রেন্ডার ও নিয়মের সঙ্গে মেলানো হয়। শুরু আর লয় আসে রেন্ডারারের লগ থেকে।",
};

export const proofBn: Partial<typeof proofEn> = {
  "proof.title": "ডেটার কণ্ঠ যাচাই",
  "proof.figureLabel": "ডায়ালের প্রতিটি অবস্থানে আর প্রতিটি পরিবারে ডেটার কণ্ঠ একই",
  "proof.limit": "১ সেন্ট সীমা",
  "proof.explain":
    "প্রতিটি রেকর্ডের নিজের মানগুলো অফলাইনে রেন্ডার করা হয়: শিল্প বন্ধ রেখে, তারপর মাপ, মিশ্রণ আর সংগীতে, এবং পৃথিবী অর্কেস্ট্রার প্রতিটি পরিবারে। ডেটা-কণ্ঠের থিতু উচ্চতা অডিও থেকে মাপা হয় এবং তা ১ সেন্টের মধ্যে থাকতে হয়; শুরু আর লয় বদলাতে পারে না।",
  "proof.record.ocean": "সরাসরি সমুদ্র-পৃষ্ঠের তাপমাত্রা যাচাই (MUR)",
  "proof.record.rain": "IMERG বৃষ্টি যাচাই (ঝড়ের টাইম-ল্যাপ্স)",
  "proof.record.currents_3912": "SVS 3912 সমুদ্র-পৃষ্ঠের তাপমাত্রা যাচাই",
  "proof.record.heat": "আগে বনাম এখনের তাপ যাচাই (GISTEMP, বছরভিত্তিক)",
  "proof.record.monsoon": "আগে বনাম এখনের বর্ষার বৃষ্টি যাচাই (GPCP, বছরভিত্তিক)",
  "proof.record.water": "আগে বনাম এখনের জমা জল যাচাই (GRACE, বছরভিত্তিক)",
  "proof.categories": "পৃথিবী অর্কেস্ট্রার প্রতিটি পরিবার যাচাই",
  "proof.categories.pass": (p: { families: string; cents: string; notes: string }) =>
    `${p.families}টি পরিবার, সরাসরি কণ্ঠ ও সুর হিসেবে: প্রতিটিতে ${p.notes}টি সুর, সুরের উচ্চতায় সবচেয়ে বড় পার্থক্য ${p.cents} সেন্ট (সীমা ১)।`,
  "proof.open": "যাচাই কীভাবে হয়",
};
