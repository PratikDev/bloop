export const LANGS = ["en", "bn"] as const;
export type Lang = (typeof LANGS)[number];

/** A message is plain text or a function of its parameters. */
export type Message = string | ((p: never) => string);

/** A Bangla table: the keys of its English twin translated so far (the rest show in English, docs/i18n/TO_TRANSLATE.md). */
export type Translated<T> = Partial<T>;
