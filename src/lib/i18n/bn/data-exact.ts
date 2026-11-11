import { PLACES_BN } from "./places";

export const EXACT: Record<string, string> = {
  ...PLACES_BN,

  // Units (mapping.json rules).
  "°C": "°সে",
  "mm/h": "মিমি/ঘণ্টা",
  "mm/day": "মিমি/দিন",
  cm: "সেমি",
  "drops/s": "ফোঁটা/সেকেন্ড",
  "bells/s": "ঘণ্টাধ্বনি/সেকেন্ড",
  "drops per step": "প্রতি ধাপে ফোঁটা",
  "detections per day": "প্রতিদিন শনাক্তকরণ",
  "click strength": "ক্লিকের জোর",

  // Then vs Now (dhaka_then_now.json, firms.json).
  "In these records: hotter, no wetter, and the water underground is falling.": "এই রেকর্ডগুলোতে: আরও গরম, বেশি ভেজা নয়, আর ভূগর্ভস্থ পানি কমছে।",
  "A popular reanalysis-based dataset disagreed with independent records at this location, so we checked before you heard it.":
    "একটি জনপ্রিয় রিঅ্যানালাইসিস-ভিত্তিক ডেটাসেট এই জায়গায় স্বাধীন রেকর্ডের সাথে মেলেনি, তাই আপনাকে শোনানোর আগে আমরা যাচাই করেছি।",
  "more erratic rain (not tested)": "বৃষ্টি আরও অনিয়মিত হয়েছে (পরীক্ষা করা হয়নি)",
  "Compare MODIS with MODIS only; single years are example years.": "MODIS-কে শুধু MODIS-এর সাথে তুলনা করুন; আলাদা আলাদা বছরগুলো উদাহরণ মাত্র।",

  // mapping.json: voice names still marked TODO there.
  "Heat: how unusual": "তাপ: কতটা অস্বাভাবিক",
  "Satellite whisper": "স্যাটেলাইটের ফিসফিস",
  "Extreme ping": "চরম মানের সংকেত",
  "Sonic identity": "সোনিক পরিচয়",

  // mapping.json: rules for every sound.
  "Master volume is capped: all voices together stay below full scale.": "মূল ভলিউমের একটি সীমা আছে: সব কণ্ঠ মিলেও পূর্ণ মাত্রার নিচে থাকে।",
  "A limiter on the master output is a safety net against sudden loud sounds.": "মূল আউটপুটে একটি লিমিটার হঠাৎ জোরালো শব্দ থেকে সুরক্ষা দেয়।",
  "Every voice can be muted or soloed.": "প্রতিটি কণ্ঠ মিউট বা সোলো করা যায়।",
  "Style or instrument choices may change timbre only, never the value-to-pitch or value-to-density rules.":
    "ধরন বা বাদ্যযন্ত্রের পছন্দ শুধু শব্দের রং বদলাতে পারে, মান-থেকে-সুর বা মান-থেকে-ঘনত্বের নিয়ম কখনো নয়।",
  "Silence means no data (land, dry, or no measurement), never zero.": "নীরবতা মানে তথ্য নেই (স্থলভাগ, শুকনো, বা পরিমাপ নেই), কখনো শূন্য নয়।",
  "Left-right position follows longitude: west is left, east is right.": "বাঁ-ডান অবস্থান দ্রাঘিমাংশ মেনে চলে: পশ্চিম বাঁয়ে, পূর্ব ডানে।",

  // mapping.json: silences.
  "Land or no data at this point.": "এই বিন্দুতে স্থলভাগ, বা তথ্য নেই।",
  "Dry, or no data at this point.": "এই বিন্দুতে শুকনো, বা তথ্য নেই।",
  "No snow, or no data at this point.": "এই বিন্দুতে তুষার নেই, বা তথ্য নেই।",
  "No value for that year.": "সেই বছরের কোনো মান নেই।",
  "No value for that step.": "সেই ধাপের কোনো মান নেই।",
  "No value for that date.": "সেই তারিখের কোনো মান নেই।",
  "No fire detections that day.": "সেদিন কোনো আগুন শনাক্ত হয়নি।",
  "Plays once when the cursor enters an area with no data; the area itself stays silent.": "কার্সর তথ্যহীন এলাকায় ঢুকলে একবার বাজে; এলাকাটি নিজে নীরব থাকে।",
  "Plays only after a spoken value.": "শুধু একটি মান পড়ে শোনানোর পরে বাজে।",
  "Plays once per request.": "প্রতি অনুরোধে একবার বাজে।",
  "A latitude band with no ocean data is a rest.": "যে অক্ষাংশ-বলয়ে সমুদ্রের তথ্য নেই, সেখানে বিরতি।",

  // mapping.json: notes.
  "Drop timing varies slightly so it sounds like real rain; the average rate always follows the rule. Legend points are our choice.":
    "আসল বৃষ্টির মতো শোনাতে ফোঁটার সময় একটু এদিক-ওদিক হয়; গড় হার সবসময় নিয়ম মেনে চলে। লেজেন্ডের বিন্দুগুলো আমাদের বেছে নেওয়া।",
  "Same density rule as rain; only the sound changes. Legend points are our choice.": "বৃষ্টির মতোই ঘনত্বের নিয়ম; শুধু শব্দটি আলাদা। লেজেন্ডের বিন্দুগুলো আমাদের বেছে নেওয়া।",
  "Not paired with an EIC frame: a long-term context record. The same pitch means a different temperature than in the ocean voice, so the sound is different on purpose.":
    "কোনো EIC ফ্রেমের সাথে জোড়া নয়: এটি দীর্ঘমেয়াদি প্রসঙ্গ-রেকর্ড। একই সুর এখানে সমুদ্রের কণ্ঠের চেয়ে ভিন্ন তাপমাত্রা বোঝায়, তাই শব্দটি ইচ্ছে করেই আলাদা।",
  "Our design choice (Anomaly Choir): consonant means close to normal, dissonant means unusual, not 'bad'. Warm and cold anomalies are treated the same. Detune amounts are starting values. Shares the heat voice's volume budget.":
    "আমাদের নকশাগত সিদ্ধান্ত (অ্যানোমালি কয়্যার): সুরেলা মানে স্বাভাবিকের কাছাকাছি, বেসুরো মানে অস্বাভাবিক, ‘খারাপ’ নয়। উষ্ণ ও শীতল বিচ্যুতি একইভাবে ধরা হয়। ডিটিউনের পরিমাণগুলো প্রাথমিক মান। তাপের কণ্ঠের ভলিউম-সীমা ভাগ করে নেয়।",
  "Not paired with an EIC frame: a long-term context record.": "কোনো EIC ফ্রেমের সাথে জোড়া নয়: এটি দীর্ঘমেয়াদি প্রসঙ্গ-রেকর্ড।",
  "Our design choice, so silence over land is not mistaken for the app freezing.": "আমাদের নকশাগত সিদ্ধান্ত, যাতে স্থলভাগের নীরবতাকে অ্যাপ আটকে যাওয়া বলে ভুল না হয়।",
  "The caption names the dataset and mission that measured the value.": "ক্যাপশনে সেই ডেটাসেট ও মিশনের নাম থাকে, যা মানটি মেপেছে।",

  // mapping.json: timbres.
  "Warm sine with a soft attack and a smooth glide": "নরম শুরু আর মসৃণ গ্লাইডসহ উষ্ণ সাইন তরঙ্গ",
  "Short band-passed noise bursts, like raindrops; slightly louder as rain gets heavier": "বৃষ্টির ফোঁটার মতো ছোট ব্যান্ড-পাস নয়েজের ঝলক; বৃষ্টি ভারী হলে একটু জোরে",
  "Soft bell (sine partials, slow decay)": "নরম ঘণ্টা (সাইন পার্শিয়াল, ধীরে মিলিয়ে যায়)",
  "Triangle wave through a low-pass filter (deliberately different from the ocean sine)": "লো-পাস ফিল্টারের ভেতর দিয়ে ত্রিভুজ তরঙ্গ (ইচ্ছে করেই সমুদ্রের সাইন থেকে আলাদা)",
  "Rain drops, a fixed number per step": "বৃষ্টির ফোঁটা, প্রতি ধাপে নির্দিষ্ট সংখ্যায়",
  "Percussive click": "তালবাদ্যের মতো ক্লিক",
  "Slow pad": "ধীর প্যাড",
  "Soft two-note chime": "দুই নোটের নরম চাইম",
  "One short bright tone at the extreme point's position": "চরম বিন্দুর অবস্থানে একটি ছোট উজ্জ্বল সুর",
  "Four soft bell-sine notes": "চারটি নরম ঘণ্টা-সাইন নোট",

  // mapping.json: the heat deviation bands.
  "close to normal": "স্বাভাবিকের কাছাকাছি",
  "a little unusual": "একটু অস্বাভাবিক",
  unusual: "অস্বাভাবিক",
  "very unusual": "খুব অস্বাভাবিক",
};
