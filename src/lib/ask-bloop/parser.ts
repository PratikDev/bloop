// Ask Bloop's deterministic parser: English and Bangla patterns and keyword sets, no network and no key, so
// it works offline and in the audio-lite mode. It returns an intent with the place words as said (resolvePlace maps
// them) and a confidence; below PARSE_THRESHOLD nothing runs and Bloop asks a short question instead.
import type { TrackMode } from "@/lib/audio/types";
import type { AskPage, Extreme, Intent, SettingChange } from "./intents";
import { monthsIn, normaliseUtterance, withoutMonths } from "./normalise";
import { dataIntentFor } from "./data-intents";

interface Parsed {
  intent: Intent;
  /** 0–1: a whole-phrase match is SURE; a keyword match is LIKELY. */
  confidence: number;
}

const SURE = 0.9;
const LIKELY = 0.7;
/** Only matches at or above this run (spec: "a fixed threshold"). */
export const PARSE_THRESHOLD = 0.6;

const RECORD_WORDS: readonly (readonly [RegExp, TrackMode])[] = [
  [/both|ocean and rain|দুটো|দুই/u, "both"],
  [/ocean|sea|sst|temperature|সমুদ্র|সাগর|তাপমাত্রা/u, "ocean"],
  [/rain|precipitation|বৃষ্টি/u, "rain"],
];
const recordIn = (t: string): TrackMode | null => RECORD_WORDS.find(([re]) => re.test(t))?.[1] ?? null;

const PAGE_WORDS: readonly (readonly [RegExp, AskPage])[] = [
  [/then (?:vs|versus|and) now|আগে বনাম এখন|তখন বনাম এখন/u, "thenNow"],
  [/how we know|কীভাবে জানি/u, "how"],
  [/official records?|অফিসিয়াল রেকর্ড/u, "official"],
  [/turntable|টার্নটেবিল/u, "turntable"],
  [/(?:the )?team|দল/u, "team"],
  [/(?:the )?tour|ট্যুর|সফর/u, "tour"],
  [/listen(?: page)?|শোনার পাতা/u, "listen"],
  [/home(?: page)?|start page|হোম|শুরুর পাতা/u, "home"],
];

const HIGH = /warmest|hottest|highest|wettest|most rain|rainiest|গরম|বেশি|উঁচু|সর্বোচ্চ/u;
const LOW = /coldest|coolest|lowest|driest|least rain|ঠান্ডা|কম|নিচু|সর্বনিম্ন/u;

/** "here", "near here", "nearby" (English and Bangla): no place named. */
const HERE = /^(?:here|near here|nearby|around here|close by|this place|এখানে|কাছে|কাছাকাছি|আশেপাশে)$/u;
const placeOrHere = (p: string | undefined): string | null => (p === undefined || HERE.test(p.trim()) ? null : p.trim() || null);

/** Strips leading articles and trailing fillers from English place words. */
const placeWords = (s: string) =>
  s
    .replace(/^(?:the|a)\s+/u, "")
    .replace(/\s+(?:please|now|today|right now|bangladesh)$/u, "")
    .trim();

type Rule = (t: string) => Parsed | null;
const sure = (intent: Intent): Parsed => ({ intent, confidence: SURE });
const likely = (intent: Intent): Parsed => ({ intent, confidence: LIKELY });
/** A rule matching any of `patterns` against the whole utterance. */
const whole = (patterns: RegExp, intent: Intent): Rule => (t) => (patterns.test(t) ? sure(intent) : null);

const SETTINGS: readonly (readonly [RegExp, SettingChange])[] = [
  [/^(?:shorter|short|brief|briefer) answers?$|less detail|^ছোট উত্তর$|সংক্ষেপে/u, { setting: "verbosity", value: "brief" }],
  [/^(?:longer|detailed|full) answers?$|^(?:more )?detailed answers$|^বিস্তারিত উত্তর$/u, { setting: "verbosity", value: "detailed" }],
  [/^(?:normal|standard) answers?$|^সাধারণ উত্তর$/u, { setting: "verbosity", value: "standard" }],
  [/bloop'?s voice|use (?:your|the app'?s) voice|ব্লুপের কণ্ঠ/u, { setting: "speech_output", value: "voice" }],
  [/(?:my|use the) screen ?reader|স্ক্রিন রিডার/u, { setting: "speech_output", value: "screenReader" }],
  [/^(?:speech off|turn speech off|no speech|কথা বন্ধ)$/u, { setting: "speech_output", value: "off" }],
  [/(?:speak|talk|answer|reply) (?:in )?bangla|(?:speak|talk|answer|reply) (?:in )?bengali|^বাংলায় বলো$|^বাংলায়$/u, { setting: "input_language", value: "bn" }],
  [/(?:speak|talk|answer|reply) (?:in )?english|^ইংরেজিতে বলো$/u, { setting: "input_language", value: "en" }],
];

/** In order: the most specific first (a page name before a place, a record before plain "play"). */
const RULES: readonly Rule[] = [
  // Controls and conversation.
  whole(/^(?:help|what can i (?:say|ask)|what can you do|commands|সাহায্য|কী বলতে পারি|তুমি কী পারো|কী জিজ্ঞেস করতে পারি)$/u, { name: "help" }),
  whole(/^(?:repeat|say (?:that|it) again|again(?: please)?|pardon|আবার বলো|আরেকবার বলো|পুনরায় বলো)$/u, { name: "repeat" }),
  whole(/^(?:more|tell me more|more detail|more details|go on|আরও বলো|আরও বিস্তারিত|বিস্তারিত বলো)$/u, { name: "more" }),
  whole(/^(?:cancel|never ?mind|stop listening|forget it|বাতিল|থাক|শোনা বন্ধ করো)$/u, { name: "cancel" }),
  (t) => {
    const s = SETTINGS.find(([re]) => re.test(t));
    return s ? sure({ name: "set_setting", ...s[1] }) : null;
  },
  // fire weather, fires, landslides, night lights here (src/lib/ask-bloop/data-intents.ts).
  (t) => {
    const name = dataIntentFor(t);
    return name ? sure({ name }) : null;
  },
  // Pages.
  (t) => {
    const m = /^(?:open|show(?: me)?|go to|take me to|switch to)\s+(.+)$|^(.+?)\s+(?:খোলো|দেখাও|যাও)$/u.exec(t);
    const words = m?.[1] ?? m?.[2];
    const page = words ? PAGE_WORDS.find(([re]) => new RegExp(`^(?:${re.source})$`, "u").test(words.replace(/^the\s+/u, "").replace(/(?:ে|এ|য়)$/u, "")))?.[1] : undefined;
    return page ? sure({ name: "open_page", page }) : null;
  },
  // Records and frames.
  whole(/^(?:next|the next) (?:record|track)$|^(?:the )?next one$|^পরের (?:রেকর্ড|ট্র্যাক)$|^পরেরটা$/u, { name: "next_record" }),
  whole(/^(?:previous|the previous|last) (?:record|track)$|^go back a (?:record|track)$|^আগের (?:রেকর্ড|ট্র্যাক)$|^আগেরটা$/u, { name: "previous_record" }),
  whole(/^(?:next|newer|a newer)(?: rain)? frame$|^(?:পরের|নতুন) ফ্রেম$/u, { name: "set_time", step: "next_frame" }),
  whole(/^(?:previous|older|an older|last)(?: rain)? frame$|^(?:আগের|পুরোনো) ফ্রেম$/u, { name: "set_time", step: "previous_frame" }),
  (t) => {
    const bn = /^(.+?)\s+(?:শোনাও|চালাও|বাজাও)$/u.exec(t);
    const en = /^(?:play|switch to|listen to|hear|choose|select|just)?\s*(?:the\s+)?(.+?)(?: records?| track)?$/u.exec(t);
    const words = (bn?.[1] ?? en?.[1] ?? "").trim();
    if (!/^(?:both|ocean and rain|ocean|sea|sst|rain|rainfall|precipitation|সমুদ্র|সাগর|বৃষ্টি|দুটোই|দুটো)$/u.test(words)) return null;
    const record = recordIn(words);
    return record ? sure({ name: "select_record", record }) : null;
  },
  // Playback.
  whole(/^(?:play|start(?: the)? sound|resume|play sound|চালাও|শব্দ চালু করো|আবার চালাও|চালু করো)$/u, { name: "play" }),
  whole(/^(?:pause|hold on|wait|pause (?:the )?sound|থামো|একটু থামাও|বিরতি|থামাও)$/u, { name: "pause" }),
  whole(/^(?:stop|stop everything|stop all|silence|quiet|বন্ধ করো|সব বন্ধ করো|চুপ)$/u, { name: "stop" }),
  // Questions about the sound and the record.
  whole(/^(?:what am i hearing|what is this sound|what's this sound|what does the (?:pitch|sound) mean|আমি কী শুনছি|এই শব্দ কী|সুর উঁচু মানে কী)$/u, { name: "what_am_i_hearing" }),
  whole(/^(?:how (?:reliable|accurate|good|trustworthy) is (?:this|it|that)(?: value| record)?|can i trust (?:this|it)(?: value)?|এটা কতটা (?:নির্ভরযোগ্য|সঠিক)|এই মান কি বিশ্বাসযোগ্য)$/u, { name: "how_reliable" }),
  (t) => {
    if (!/(?:tell me )?about (?:this|the) .*record|^what is the .*record$|রেকর্ড সম্পর্কে বলো|রেকর্ড কী$/u.test(t)) return null;
    return sure({ name: "about_record", record: /this|এই/u.test(t) ? null : recordIn(t) });
  },
  // Compare two months (Compare two dates).
  (t) => {
    if (!/compare|versus|\bvs\b|তুলনা/u.test(t)) return null;
    const [dateA, dateB] = monthsIn(t);
    if (!dateA || !dateB) return null;
    const rest = withoutMonths(t);
    const en = /\b(?:in|at|for|near)\s+(.+?)(?:\s+(?:with|and|vs|versus))?$/u.exec(rest.replace(/^compare\s+/u, ""));
    const bn = /^(\S+?)\s+(?:আর|ও|এবং)?/u.exec(rest);
    const place = en ? placeWords(en[1]) : bn && /(?:ে|য়|তে)$/u.test(bn[1]) && !/তুলনা/u.test(bn[1]) ? bn[1] : null;
    return sure({ name: "compare_dates", place: placeOrHere(place ?? undefined), dateA, dateB });
  },
  // Highest / lowest near here or in a place.
  (t) => {
    if (!/warmest|hottest|highest|wettest|most rain|rainiest|coldest|coolest|lowest|driest|least rain|সবচেয়ে/u.test(t)) return null;
    // Low words first: "সবচেয়ে কম গরম" (least warm) is the lowest.
    const kind: Extreme | null = LOW.test(t) ? "lowest" : HIGH.test(t) ? "highest" : null;
    if (!kind) return null;
    const en = /\b(?:in|near|around|over|across)\s+(.+?)(?:\s+(?:now|today))?$/u.exec(t);
    const bn = /^(\S+?)\s+সবচেয়ে/u.exec(t);
    const words = en ? placeWords(en[1]) : bn?.[1];
    return sure({ name: "extreme_in", kind, place: placeOrHere(words) });
  },
  // A value somewhere else.
  (t) => {
    const en =
      /^(?:what(?:'s| is) the |what is |whats the )?(?:temperature|value|reading|rain(?:fall)?|sea temperature)(?: like)? (?:in|at|for|near|of) (.+)$/u.exec(t) ??
      /^how (?:much rain|warm|hot|cold|wet|rainy) (?:is it )?(?:in|at|near) (.+)$/u.exec(t) ??
      /^(?:value|temperature|rain) (?:at|in) (.+)$/u.exec(t);
    const bn = /^(\S+?)\s+(?:তাপমাত্রা|বৃষ্টি|মান)\s+কত$/u.exec(t);
    const words = en ? placeWords(en[1]) : bn?.[1];
    if (!words) return null;
    const place = placeOrHere(words);
    return sure(place ? { name: "value_at", place } : { name: "value_here" });
  },
  // The value here.
  whole(/^(?:what(?:'s| is) (?:the )?(?:value|temperature|reading|rain) here|how (?:warm|hot|cold|wet) is it here|what'?s here|what is here|value here|where am i|এখানে (?:মান|তাপমাত্রা|বৃষ্টি) কত|এখানে কত গরম|এখানে কী)$/u, { name: "value_here" }),
  // Go somewhere.
  (t) => {
    const en = /^(?:go|take me|move|jump|fly|head|bring me|travel)(?: me)? (?:to|over to) (.+)$/u.exec(t);
    const bn = /^(.+?)\s+(?:যাও|নিয়ে চলো|নিয়ে যাও|চলো)$/u.exec(t);
    const words = en ? placeWords(en[1]) : bn?.[1];
    return words ? sure({ name: "go_to_place", place: words }) : null;
  },
  // Keyword fallbacks (LIKELY): a value word with "here", a place after "in".
  (t) => (/\bhere\b|এখানে/u.test(t) && /value|warm|hot|temperature|rain|মান|গরম|তাপমাত্রা|বৃষ্টি/u.test(t) ? likely({ name: "value_here" }) : null),
];

/** The best intent for what was typed or said, or null when nothing matches well enough (ask a short question). */
export function parseUtterance(raw: string): Parsed | null {
  const t = normaliseUtterance(raw);
  if (!t) return null;
  for (const rule of RULES) {
    const p = rule(t);
    if (p && p.confidence >= PARSE_THRESHOLD) return p;
  }
  return null;
}
