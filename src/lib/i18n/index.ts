// t(lang, key, params): every visible string goes through here. The Bangla table
// holds the keys translated so far (bn/); any other key shows in English, and is
// listed in docs/i18n/TO_TRANSLATE.md (kept in step by i18n.test.ts). English
// prose from the data files goes through "data.text" (bn/data.ts).

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { BANGLA_SPEECH_READY, bn as bnTranslated } from "./bn";
import { appEn } from "./en/app";
import { badgesEn } from "./en/badges";
import { brailleEn } from "./en/braille";
import { captionsEn } from "./en/captions";
import { contextEn } from "./en/context";
import { dataEn } from "./en/data";
import { helpEn } from "./en/help";
import { officialEn } from "./en/official";
import { pagesEn } from "./en/pages";
import { panelsEn } from "./en/panels";
import { storyEn } from "./en/story";
import { scenesEn } from "./en/scenes";
import { framesEn } from "./en/frames";
import { statsEn } from "./en/stats";
import { turntableEn } from "./en/turntable";
import type { Lang } from "./types";

export const en = {
  ...appEn,
  ...helpEn,
  ...captionsEn,
  ...panelsEn,
  ...contextEn,
  ...storyEn,
  ...pagesEn,
  ...turntableEn,
  ...scenesEn,
  ...badgesEn,
  ...dataEn,
  ...officialEn,
  ...brailleEn,
  ...statsEn,
  ...framesEn,
};

export type Messages = typeof en;
export type MessageKey = keyof Messages;
type ParamsOf<K extends MessageKey> = Messages[K] extends (p: infer P) => string ? P : never;
export type ArgsOf<K extends MessageKey> = [ParamsOf<K>] extends [never] ? [] : [ParamsOf<K>];

/** Bangla: every translated key, English for the rest (until a teammate translates them). */
const bn: Messages = { ...en, ...bnTranslated };

/** The keys still shown in English in Bangla (docs/i18n/TO_TRANSLATE.md). */
export const UNTRANSLATED_KEYS = (Object.keys(en) as MessageKey[]).filter((key) => !(key in bnTranslated));

const TABLES: Record<Lang, Messages> = { en, bn };

export function t<K extends MessageKey>(lang: Lang, key: K, ...args: ArgsOf<K>): string {
  const msg = TABLES[lang][key];
  if (typeof msg === "string") return msg;
  return (msg as (p: ArgsOf<K>[0]) => string)(args[0]);
}

/** The language built-in speech may use: English until Bangla speech is ready (plan §17). */
export function speechLang(lang: Lang): Lang {
  return lang === "bn" && BANGLA_SPEECH_READY ? "bn" : "en";
}

/** t() bound to one language. */
export function bindT(lang: Lang) {
  return <K extends MessageKey>(key: K, ...args: ArgsOf<K>) => t(lang, key, ...args);
}

export type BoundT = ReturnType<typeof bindT>;

function isMessageKey(key: string): key is MessageKey {
  return key in en;
}

/** Caption text for a sound event from the engine. Unknown keys show as-is. */
export function captionText(lang: Lang, key: string, params: CaptionParams): string {
  if (!isMessageKey(key)) return key;
  const msg = TABLES[lang][key];
  if (typeof msg === "string") return msg;
  return (msg as (p: CaptionParams) => string)(params);
}

export type { Lang };
export { LANGS } from "./types";
export * from "./format";
