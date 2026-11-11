// The app's side of the LLM fallback (spec §5.4): asked only with NEXT_PUBLIC_ASK_BLOOP_LLM=1 and a deployed route
// (NEXT_PUBLIC_ASK_BLOOP_LLM_URL). It sends the words and the record id; whatever comes back is validated again here.
import type { Intent } from "../intents";
import { validateIntent } from "../validate";
import { TIMEOUT_MS, type AskIntentReply } from "./types";

export const LLM_URL = process.env.NEXT_PUBLIC_ASK_BLOOP_LLM_URL ?? "";

/** The route's intent for `text`, or null (off, unreachable, slow, or nothing valid). */
export async function llmIntent(text: string, record: string, url: string = LLM_URL): Promise<Intent | null> {
  if (!url) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS + 500);
  try {
    const res = await fetch(url, { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ text, record }) });
    if (!res.ok) return null;
    const reply = (await res.json()) as AskIntentReply;
    return reply.ok ? validateIntent(reply.intent) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
