export const LANGS = ["en", "bn"] as const;
export type Lang = (typeof LANGS)[number];

/** A Bangla table: the keys of its English twin translated so far (the rest show in English, docs/i18n/TO_TRANSLATE.md). */
export type Translated<T> = Partial<T>;
