import { formatAxis, formatInteger, formatUtc } from "../format";
import type { Messages } from "../index";

const int = (v: number) => formatInteger(v, "bn");

export const accessBn: Partial<Messages> = {
  "access.speech": "কথা",
  "access.speech.screenReader": "আমার স্ক্রিন রিডার",
  "access.speech.voice": "ব্লুপের কণ্ঠ",
  "access.speech.off": "বন্ধ",
  "access.speech.note": "আমার স্ক্রিন রিডার: ব্লুপ তার কথা আপনার স্ক্রিন রিডারে পাঠায়। ব্লুপের কণ্ঠ: ব্লুপ নিজেই বলে। কখনো দুটো একসাথে নয়।",
  "access.verbosity": "বিস্তারিত",
  "access.verbosity.brief": "সংক্ষেপে",
  "access.verbosity.standard": "সাধারণ",
  "access.verbosity.detailed": "বিস্তারিত",
  "access.channels": "প্রতিটি ধাপে",
  "access.channels.both": "লেখা ও শব্দ",
  "access.channels.text": "শুধু লেখা",
  "access.channels.sound": "শুধু শব্দ",
  "access.braille": "ব্রেইল ডিসপ্লে",
  "access.braille.full": "পুরো লাইন",
  "access.braille.short": "ছোট লাইন",
  "access.braille.note": "ছোট লাইন: বর্ণনা, তুলনা, সোনারের খোঁজ বা উৎসের লাইন একটি ছোট লাইনে পাঠানো হয়। পুরো লেখা বর্ণনা ট্যাবে আর লগে থাকে, আর শব্দ চালু থাকলে ক্যাপশন বারেও।",

  "access.hide3d": "৩ডি দৃশ্য লুকান",
  "access.hide3d.note": "৩ডি দৃশ্য লুকানো (সেটিংস)। সুই, তার মান ও সব কী আগের মতোই কাজ করে।",

  "map.instructions.core": "তীর-কী দিয়ে কার্সর সরান; প্লাস ও মাইনাস দিয়ে ধাপ বদলান। Enter চাপলে মান, D চাপলে এখানকার বর্ণনা। H চাপলে সব কী-র তালিকা।",
  "map.focusHint": "H: সব কী। Esc: থামান।",
  "map.cell": (p: { deg: number }) => `ধাপ ${formatAxis(p.deg, "bn")} ডিগ্রি।`,
  "map.regions": "অঞ্চল: ১ থেকে ৯ চাপুন। ৭, ৮, ৯ উত্তরের সারি; ১, ২, ৩ দক্ষিণের সারি। আবার J চাপলে পুরো মানচিত্র থেকে শুরু।",
  "map.region": (p: { n: number; name: string }) => `অঞ্চল ${int(p.n)}, ${p.name}।`,
  "map.back.none": "ফিরে যাওয়ার আগের কোনো জায়গা নেই।",
  "region.southWest": "দক্ষিণ-পশ্চিম",
  "region.south": "দক্ষিণ",
  "region.southEast": "দক্ষিণ-পূর্ব",
  "region.west": "পশ্চিম",
  "region.centre": "মাঝখান",
  "region.east": "পূর্ব",
  "region.northWest": "উত্তর-পশ্চিম",
  "region.north": "উত্তর",
  "region.northEast": "উত্তর-পূর্ব",

  "frames.held": (p: { index: number; total: number; timeUtc: string }) => `বৃষ্টির ফ্রেম ${int(p.index)} / ${int(p.total)}, ${formatUtc(p.timeUtc, "bn")} UTC।`,
  "frames.live": "সর্বশেষ ফ্রেম।",
  "frames.newest": "এটিই সর্বশেষ ফ্রেম।",
  "frames.oldest": "এটিই বৃষ্টির সবচেয়ে পুরোনো ফ্রেম।",

  "key.cell.action": "তীর-কীর ধাপ ছোট বা বড় করুন (পাঁচটি মাপ; নতুন মাপ বলা হয়)",
  "key.regions": "J, তারপর ১ – ৯",
  "key.regions.action": "মানচিত্রের নয়টি অঞ্চলের একটিতে যান (৭ ৮ ৯ = উত্তরের সারি); আরেকটি সংখ্যা চাপলে আরও ছোট অঞ্চল",
  "key.back.action": "আগের জায়গায় ফিরুন",
  "key.frames": "Page Up / Page Down",
  "key.frames.action": "কার্সরের জায়গায় নতুন বা পুরোনো বৃষ্টির ফ্রেম (ঝড়ের টাইম-ল্যাপস)",
  "key.d.here.action": "এখানকার বর্ণনা, একবার",
  "key.shiftD.action": "বর্ণনা মোড চালু বা বন্ধ",
  "help.browseNote":
    "NVDA বা JAWS-এ এই কী-গুলো ফোকাস মোডে মানচিত্রে পৌঁছায়; মানচিত্রে ফোকাস এলে ফোকাস মোড নিজেই চালু হয়। নামপ্যাডের প্লাস ও মাইনাস JAWS-এর: মূল কীবোর্ডের + ও − ব্যবহার করুন।",
};
