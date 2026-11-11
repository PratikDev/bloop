// Ask Bloop's intent registry: for each intent, whether it acts or answers, and how people say it in
// English and Bangla. The examples are the parser's test set (every one must parse to its intent) and the starter
// suggestions' source. The handlers are bound in src/components/AskBloop (each calls what the UI or a key already
// calls); the answer templates are the i18n keys "ask.answer.<intent>" (en/ask-bloop.ts, bn/ask-bloop.ts).
// Bangla examples are drafts until a Bangla speaker checks them (needsReview).
import type { IntentKind, IntentName } from "./intents";
import { DATA_REGISTRY } from "./data-intents";

export interface IntentSpec {
  kind: IntentKind;
  examples: { en: readonly string[]; bn: readonly string[] };
}

export const REGISTRY = {
  play: { kind: "action", examples: { en: ["play", "start the sound", "resume"], bn: ["চালাও", "শব্দ চালু করো", "আবার চালাও"] } },
  pause: { kind: "action", examples: { en: ["pause", "hold on", "pause the sound"], bn: ["থামো", "একটু থামাও", "বিরতি"] } },
  stop: { kind: "action", examples: { en: ["stop", "stop everything", "silence"], bn: ["বন্ধ করো", "সব বন্ধ করো", "চুপ"] } },
  select_record: {
    kind: "action",
    examples: { en: ["play the ocean", "switch to rain", "both records"], bn: ["সমুদ্র শোনাও", "বৃষ্টি শোনাও", "দুটোই শোনাও"] },
  },
  next_record: { kind: "action", examples: { en: ["next record", "next track", "the next one"], bn: ["পরের রেকর্ড", "পরের ট্র্যাক", "পরেরটা"] } },
  previous_record: {
    kind: "action",
    examples: { en: ["previous record", "previous track", "go back a track"], bn: ["আগের রেকর্ড", "আগের ট্র্যাক", "আগেরটা"] },
  },
  go_to_place: { kind: "action", examples: { en: ["go to Dhaka", "take me to Chattogram", "move to the Bay of Bengal"], bn: ["ঢাকায় যাও", "চট্টগ্রামে নিয়ে চলো", "বঙ্গোপসাগরে যাও"] } },
  set_time: {
    kind: "action",
    examples: { en: ["next frame", "previous frame", "an older rain frame"], bn: ["পরের ফ্রেম", "আগের ফ্রেম", "পুরোনো ফ্রেম"] },
  },
  open_page: { kind: "action", examples: { en: ["open Then vs Now", "go to the turntable", "show how we know"], bn: ["আগে বনাম এখন খোলো", "টার্নটেবিলে যাও", "কীভাবে জানি খোলো"] } },
  set_setting: {
    kind: "action",
    examples: { en: ["shorter answers", "use Bloop's voice", "speak Bangla"], bn: ["ছোট উত্তর", "ব্লুপের কণ্ঠ চালু করো", "বাংলায় বলো"] },
  },
  help: { kind: "action", examples: { en: ["help", "what can I say", "what can you do"], bn: ["সাহায্য", "কী বলতে পারি", "তুমি কী পারো"] } },
  repeat: { kind: "action", examples: { en: ["repeat", "say that again", "again please"], bn: ["আবার বলো", "আরেকবার বলো", "পুনরায় বলো"] } },
  more: { kind: "action", examples: { en: ["more", "tell me more", "more detail"], bn: ["আরও বলো", "আরও বিস্তারিত", "বিস্তারিত বলো"] } },
  cancel: { kind: "action", examples: { en: ["cancel", "never mind", "stop listening"], bn: ["বাতিল", "থাক", "শোনা বন্ধ করো"] } },
  value_here: {
    kind: "question",
    examples: { en: ["what is the value here", "how warm is it here", "what's here"], bn: ["এখানে মান কত", "এখানে কত গরম", "এখানে কী"] },
  },
  value_at: {
    kind: "question",
    examples: { en: ["what is the temperature in Dhaka", "how much rain in Sylhet", "value at Khulna"], bn: ["ঢাকায় তাপমাত্রা কত", "সিলেটে বৃষ্টি কত", "খুলনায় মান কত"] },
  },
  extreme_in: {
    kind: "question",
    examples: {
      en: ["where is the warmest spot near here", "find the wettest place in the Bay of Bengal", "lowest value near here"],
      bn: ["কাছে সবচেয়ে গরম জায়গা কোথায়", "বঙ্গোপসাগরে সবচেয়ে বেশি বৃষ্টি কোথায়", "কাছে সবচেয়ে কম মান কোথায়"],
    },
  },
  compare_dates: {
    kind: "question",
    examples: {
      en: ["compare August 2023 with March 2023", "compare 2023-08 and 2020-08 in Dhaka", "compare March 2021 and March 2001 at Chattogram"],
      bn: ["২০২৩-০৮ আর ২০২০-০৮ তুলনা করো", "ঢাকায় ২০২৩-০৮ আর ২০০১-০৮ তুলনা করো", "চট্টগ্রামে ২০২১-০৩ ও ২০০১-০৩ তুলনা"],
    },
  },
  what_am_i_hearing: {
    kind: "question",
    examples: { en: ["what am I hearing", "what is this sound", "what does the pitch mean"], bn: ["আমি কী শুনছি", "এই শব্দ কী", "সুর উঁচু মানে কী"] },
  },
  about_record: {
    kind: "question",
    examples: { en: ["tell me about this record", "about the rain record", "what is the ocean record"], bn: ["এই রেকর্ড সম্পর্কে বলো", "বৃষ্টির রেকর্ড সম্পর্কে বলো", "সমুদ্রের রেকর্ড কী"] },
  },
  how_reliable: {
    kind: "question",
    examples: { en: ["how reliable is this", "how accurate is it", "can I trust this value"], bn: ["এটা কতটা নির্ভরযোগ্য", "এটা কতটা সঠিক", "এই মান কি বিশ্বাসযোগ্য"] },
  },
  ...DATA_REGISTRY,
} as const satisfies Record<IntentName, IntentSpec>;

export const INTENT_NAMES = Object.keys(REGISTRY) as IntentName[];

/** The five starter suggestions (VizAbility): one navigation, one value, one compare, one "what am I hearing", one setting. */
export const STARTERS = ["go_to_place", "value_here", "compare_dates", "what_am_i_hearing", "set_setting"] as const satisfies readonly IntentName[];
