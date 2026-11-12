// Ask Bloop's LLM fallback (spec §5.4), built but OFF: it runs only where it is deployed as a server function with its
// keys set, and the app calls it only with NEXT_PUBLIC_ASK_BLOOP_LLM=1 (src/lib/flags.ts). Server side only: the key is
// read from the environment, never sent to the client, never logged. The request carries the transcript, the record
// ids and the registry's tools, never an image, a grid or a number of Bloop's; the reply is one intent with its
// slots, validated against the registry (src/lib/ask-bloop/validate.ts) before anything can run. Temperature 0, 4 s
// timeout, one try of the fallback provider on 429, 5xx or timeout, never a retry loop, a simple per-IP rate limit,
// no transcript stored. Logged: intent name, latency, success or failure.
import type { Intent, IntentName } from "../intents";
import { ASK_RECORDS } from "../intents";
import { validateIntent } from "../validate";
import { intentTools } from "./schema";
import { TIMEOUT_MS, type AskIntentReply } from "./types";

export { TIMEOUT_MS, type AskIntentReply };

export interface ProviderEnv {
  ASK_BLOOP_BASE_URL?: string;
  ASK_BLOOP_MODEL?: string;
  ASK_BLOOP_API_KEY?: string;
  ASK_BLOOP_FALLBACK_BASE_URL?: string;
  ASK_BLOOP_FALLBACK_MODEL?: string;
  ASK_BLOOP_FALLBACK_API_KEY?: string;
}

interface Provider {
  baseUrl: string;
  model: string;
  key: string;
}

/** Requests per IP per minute (design choice: a person asks a few times a minute). */
export const RATE_PER_MINUTE = 20;
const MAX_TEXT = 300;
const MINUTE = 60_000;

const SYSTEM =
  "You map one request from a user of Bloop (a data sonification website) to exactly one of the given functions, " +
  "with its arguments. Use only the functions given. Never invent numbers, values, units, coordinates or dates the " +
  "user did not say. If the request fits no function, call none.";

const provider = (base?: string, model?: string, key?: string): Provider | null => (base && model && key ? { baseUrl: base.replace(/\/$/u, ""), model, key } : null);

/** What the tools say about each intent (short; the model chooses by it). */
const describeIntent = (name: IntentName) => name.replace(/_/gu, " ");

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
type Log = (entry: { intent: IntentName | null; ms: number; ok: boolean }) => void;

/** One provider call: the tool-calling request, the first tool call's validated intent, or why not. */
async function callProvider(p: Provider, text: string, record: string, fetchImpl: FetchLike): Promise<{ status: number; intent: Intent | null; timeout: boolean }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      signal: ctl.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model,
        temperature: 0,
        tool_choice: "auto",
        tools: intentTools(describeIntent),
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ request: text, current_record: record, records: ASK_RECORDS }) },
        ],
      }),
    });
    if (!res.ok) return { status: res.status, intent: null, timeout: false };
    const body = (await res.json()) as { choices?: { message?: { tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[] };
    const call = body.choices?.[0]?.message?.tool_calls?.[0]?.function;
    if (!call?.name) return { status: 200, intent: null, timeout: false };
    let args: unknown;
    try {
      args = JSON.parse(call.arguments ?? "{}");
    } catch {
      return { status: 200, intent: null, timeout: false };
    }
    const intent = typeof args === "object" && args !== null ? validateIntent({ ...args, name: call.name }) : null;
    return { status: 200, intent, timeout: false };
  } catch {
    return { status: 0, intent: null, timeout: ctl.signal.aborted };
  } finally {
    clearTimeout(timer);
  }
}

const retryable = (r: { status: number; timeout: boolean }) => r.timeout || r.status === 429 || r.status >= 500 || r.status === 0;

/**
 * The route: POST `{ text, record }` → `{ ok, intent }`. `fetchImpl` and `log` are injected for tests (and so a deploy
 * can log to its own sink). The rate limit lives in this instance's memory.
 */
export function createAskIntentHandler(env: ProviderEnv, fetchImpl: FetchLike = fetch, log: Log = () => undefined) {
  const primary = provider(env.ASK_BLOOP_BASE_URL, env.ASK_BLOOP_MODEL, env.ASK_BLOOP_API_KEY);
  const fallback = provider(env.ASK_BLOOP_FALLBACK_BASE_URL, env.ASK_BLOOP_FALLBACK_MODEL, env.ASK_BLOOP_FALLBACK_API_KEY);
  const hits = new Map<string, number[]>();
  const reply = (r: AskIntentReply, status = 200) => new Response(JSON.stringify(r), { status, headers: { "content-type": "application/json" } });

  return async (req: Request): Promise<Response> => {
    if (!primary) return reply({ ok: false, reason: "unconfigured" }, 503);
    if (req.method !== "POST") return reply({ ok: false, reason: "bad-request" }, 405);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < MINUTE);
    if (recent.length >= RATE_PER_MINUTE) return reply({ ok: false, reason: "rate-limited" }, 429);
    hits.set(ip, [...recent, now]);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return reply({ ok: false, reason: "bad-request" }, 400);
    }
    const { text, record } = (typeof body === "object" && body !== null ? body : {}) as { text?: unknown; record?: unknown };
    if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT) return reply({ ok: false, reason: "bad-request" }, 400);
    const current = typeof record === "string" && (ASK_RECORDS as readonly string[]).includes(record) ? record : "ocean";

    const t0 = Date.now();
    let r = await callProvider(primary, text, current, fetchImpl);
    if (!r.intent && retryable(r) && fallback) r = await callProvider(fallback, text, current, fetchImpl);
    log({ intent: r.intent?.name ?? null, ms: Date.now() - t0, ok: r.intent !== null });
    return r.intent ? reply({ ok: true, intent: r.intent }) : reply({ ok: false, reason: r.status === 200 ? "no-intent" : "failed" });
  };
}
