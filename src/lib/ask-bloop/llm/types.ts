import type { Intent } from "../intents";

export type AskIntentReply = { ok: true; intent: Intent } | { ok: false; reason: "unconfigured" | "bad-request" | "rate-limited" | "no-intent" | "failed" };

export const TIMEOUT_MS = 4000;
