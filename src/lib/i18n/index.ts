// t(lang, key, params): every visible string goes through here.
// Bangla falls back to English until a human translation exists
// (docs/L3/bangla-strings.md). §16 wording is never machine-translated.

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { bn } from "./bn";
import { appEn } from "./en/app";
import { captionsEn } from "./en/captions";
import { contextEn } from "./en/context";
import { helpEn } from "./en/help";
import { panelsEn } from "./en/panels";
import { storyEn } from "./en/story";
import type { Lang } from "./types";

export const en = { ...appEn, ...helpEn, ...captionsEn, ...panelsEn, ...contextEn, ...storyEn };

export type Messages = typeof en;
export type MessageKey = keyof Messages;
type ParamsOf<K extends MessageKey> = Messages[K] extends (p: infer P) => string ? P : never;
export type ArgsOf<K extends MessageKey> = [ParamsOf<K>] extends [never] ? [] : [ParamsOf<K>];

const TABLES: Record<Lang, Partial<Messages>> = { en, bn };

export function t<K extends MessageKey>(lang: Lang, key: K, ...args: ArgsOf<K>): string {
  const msg = (TABLES[lang][key] ?? en[key]) as Messages[K];
  if (typeof msg === "string") return msg;
  return (msg as (p: ArgsOf<K>[0]) => string)(args[0]);
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
  const msg = TABLES[lang][key] ?? en[key];
  if (typeof msg === "string") return msg;
  return (msg as (p: CaptionParams) => string)(params);
}

export type { Lang };
export * from "./format";
