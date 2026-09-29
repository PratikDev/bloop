export const LANGS = ["en", "bn"] as const;
export type Lang = (typeof LANGS)[number];

/** A message is plain text or a function of its parameters. */
export type Message = string | ((p: never) => string);
