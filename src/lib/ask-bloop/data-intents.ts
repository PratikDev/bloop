// Ask Bloop's four DATA questions (the data-maximize spec): fire weather, fires, landslide
// exposure and night lights at the needle, answered only from the engine's values (src/components/AskBloop/data-questions.ts).
// Joined to the registry, the parser and the validator in their DATA blocks. Bangla examples are drafts.

export const DATA_INTENT_NAMES = ["fire_weather_here", "fires_here", "landslide_here", "night_lights_here"] as const;
type DataIntentName = (typeof DATA_INTENT_NAMES)[number];
export type DataIntent = { name: DataIntentName };

export const DATA_REGISTRY = {
  fire_weather_here: {
    kind: "question",
    examples: { en: ["what is the fire weather here", "fire danger here", "fire weather forecast here"], bn: ["এখানে আগুন-আবহাওয়া কেমন", "এখানে আগুনের ঝুঁকি কত", "এখানে আগুনের পূর্বাভাস"] },
  },
  fires_here: {
    kind: "question",
    examples: { en: ["are there fires here", "any fires near here", "fire detections here"], bn: ["এখানে কি আগুন আছে", "কাছে কি আগুন জ্বলছে", "এখানে আগুন শনাক্ত হয়েছে কি"] },
  },
  landslide_here: {
    kind: "question",
    examples: { en: ["landslide risk here", "is there landslide exposure here", "landslides near here"], bn: ["এখানে ভূমিধসের ঝুঁকি", "এখানে কি ভূমিধসের ঝুঁকি আছে", "কাছে ভূমিধস"] },
  },
  night_lights_here: {
    kind: "question",
    examples: { en: ["night lights here", "how bright are the night lights here", "what are the night lights like here"], bn: ["এখানে রাতের আলো", "এখানে রাতের আলো কত উজ্জ্বল", "এখানে রাতের আলো কেমন"] },
  },
} as const satisfies Record<DataIntentName, { kind: "question"; examples: { en: readonly string[]; bn: readonly string[] } }>;

/** No slots: the place is the needle. */
export const DATA_SLOTS: Record<DataIntentName, readonly string[]> = { fire_weather_here: [], fires_here: [], landslide_here: [], night_lights_here: [] };

/** The parser's DATA rules, most specific first: fire weather before fires. They run before the value rules. */
const DATA_RULES: readonly (readonly [RegExp, DataIntentName])[] = [
  [/fire[ -]?(?:weather|danger|risk|forecast)|আগুন[- ]?আবহাওয়া|আগুনের (?:ঝুঁকি|পূর্বাভাস)/u, "fire_weather_here"],
  [/landslides?|ভূমিধস/u, "landslide_here"],
  [/night[ -]?lights?|রাতের আলো/u, "night_lights_here"],
  [/\bfires?\b|hotspots?|fire detections?|আগুন/u, "fires_here"],
];

export const dataIntentFor = (normalised: string): DataIntentName | null => DATA_RULES.find(([re]) => re.test(normalised))?.[1] ?? null;
