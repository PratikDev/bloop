export type Lang = "en" | "bn";

/** A message is plain text or a function of its parameters. */
export type Message = string | ((p: never) => string);
