// What the LLM fallback's route and the app's client share.
import type { Intent } from "../intents";

export type AskIntentReply = { ok: true; intent: Intent } | { ok: false; reason: "unconfigured" | "bad-request" | "rate-limited" | "no-intent" | "failed" };

/** The provider's time limit (the client waits a little longer for the route's own reply). */
export const TIMEOUT_MS = 4000;
