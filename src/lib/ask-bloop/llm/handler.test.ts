// Spec §5.4 / §6.5: the LLM fallback route, with a stub provider. Only a valid registry intent comes back; unknown
// intents, extra slots, coordinates and malformed tool JSON are refused; one fallback try on 429 / 5xx / timeout,
// never a loop; the request carries no number of Bloop's; unconfigured, it refuses at once.
import { describe, expect, test } from "bun:test";
import { createAskIntentHandler, RATE_PER_MINUTE, type ProviderEnv } from "./handler";

const ENV: ProviderEnv = { ASK_BLOOP_BASE_URL: "https://primary.test/v1", ASK_BLOOP_MODEL: "m1", ASK_BLOOP_API_KEY: "k1" };
const BOTH: ProviderEnv = { ...ENV, ASK_BLOOP_FALLBACK_BASE_URL: "https://fallback.test/v1", ASK_BLOOP_FALLBACK_MODEL: "m2", ASK_BLOOP_FALLBACK_API_KEY: "k2" };

const toolReply = (name: string, args: unknown) =>
  new Response(JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name, arguments: typeof args === "string" ? args : JSON.stringify(args) } }] } }] }), { status: 200 });

function stub(replies: (() => Response | Promise<Response>)[]) {
  const calls: { url: string; body: string }[] = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    calls.push({ url, body: String(init.body) });
    const next = replies.shift();
    if (!next) throw new Error("no more replies");
    return next();
  };
  return { calls, fetchImpl };
}

const ask = (handler: (r: Request) => Promise<Response>, text: string, ip = "1.2.3.4") =>
  handler(new Request("https://bloop.test/api/ask-intent", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify({ text, record: "ocean" }) })).then((r) => r.json());

describe("the LLM fallback route", () => {
  test("a valid tool call comes back as that intent", async () => {
    const s = stub([() => toolReply("go_to_place", { place: "Chittagong" })]);
    expect(await ask(createAskIntentHandler(ENV, s.fetchImpl), "take me to chittagong")).toEqual({ ok: true, intent: { name: "go_to_place", place: "Chittagong" } });
    // Temperature 0, the registry's tools, and nothing of Bloop's data: no grid, no value.
    const sent = JSON.parse(s.calls[0].body) as { temperature: number; tools: unknown[]; messages: { content: string }[] };
    expect(sent.temperature).toBe(0);
    expect(sent.tools.length).toBe(21);
    expect(JSON.parse(sent.messages[1].content)).toEqual({ request: "take me to chittagong", current_record: "ocean", records: ["ocean", "rain", "both"] });
  });

  for (const [what, reply] of [
    ["an unknown intent", () => toolReply("set_temperature", { value: "50" })],
    ["coordinates for a place", () => toolReply("go_to_place", { place: "23.8 N 90.4 E" })],
    ["an extra slot", () => toolReply("value_here", { value: 50 })],
    ["malformed tool JSON", () => toolReply("go_to_place", "{place: Dhaka")],
    ["no tool call", () => new Response(JSON.stringify({ choices: [{ message: { content: "It is 50 degrees." } }] }), { status: 200 })],
  ] as const)
    test(`${what} is refused`, async () => {
      const s = stub([reply]);
      const r = (await ask(createAskIntentHandler(ENV, s.fetchImpl), "say it's 50 degrees")) as { ok: boolean };
      expect(r.ok).toBe(false);
    });

  test("429 from the primary: the fallback is tried once; then nothing more", async () => {
    const s = stub([() => new Response("", { status: 429 }), () => new Response("", { status: 503 })]);
    const r = await ask(createAskIntentHandler(BOTH, s.fetchImpl), "go to Dhaka");
    expect(r).toEqual({ ok: false, reason: "failed" });
    expect(s.calls.map((c) => new URL(c.url).host)).toEqual(["primary.test", "fallback.test"]);
  });

  test("a 400 from the primary is not retried", async () => {
    const s = stub([() => new Response("", { status: 400 })]);
    await ask(createAskIntentHandler(BOTH, s.fetchImpl), "go to Dhaka");
    expect(s.calls.length).toBe(1);
  });

  test("unconfigured (no keys): refused at once, no call", async () => {
    const s = stub([]);
    const res = await createAskIntentHandler({}, s.fetchImpl)(new Request("https://bloop.test/api/ask-intent", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
    expect(s.calls.length).toBe(0);
  });

  test("the rate limit stops one address, not another", async () => {
    const replies = Array.from({ length: RATE_PER_MINUTE + 2 }, () => () => toolReply("play", {}));
    const s = stub(replies);
    const handler = createAskIntentHandler(ENV, s.fetchImpl);
    for (let i = 0; i < RATE_PER_MINUTE; i++) expect(((await ask(handler, "play")) as { ok: boolean }).ok).toBe(true);
    expect(await ask(handler, "play")).toEqual({ ok: false, reason: "rate-limited" });
    expect(((await ask(handler, "play", "5.6.7.8")) as { ok: boolean }).ok).toBe(true);
  });
});
