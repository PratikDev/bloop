// Ask Bloop's LLM fallback as a standalone server function (spec §5.4). NOT deployed: Bloop is a static export (no
// server routes), so this is the file a team would deploy on its own (for example as a Vercel function or a
// Cloudflare Worker) with the ASK_BLOOP_* variables set, then build the app with NEXT_PUBLIC_ASK_BLOOP_LLM=1 and
// NEXT_PUBLIC_ASK_BLOOP_LLM_URL pointing at it. Every rule lives in src/lib/ask-bloop/llm/handler.ts.
import { createAskIntentHandler } from "../../src/lib/ask-bloop/llm/handler";

const env = process.env;
const handler = createAskIntentHandler(
  {
    ASK_BLOOP_BASE_URL: env.ASK_BLOOP_BASE_URL,
    ASK_BLOOP_MODEL: env.ASK_BLOOP_MODEL,
    ASK_BLOOP_API_KEY: env.ASK_BLOOP_API_KEY,
    ASK_BLOOP_FALLBACK_BASE_URL: env.ASK_BLOOP_FALLBACK_BASE_URL,
    ASK_BLOOP_FALLBACK_MODEL: env.ASK_BLOOP_FALLBACK_MODEL,
    ASK_BLOOP_FALLBACK_API_KEY: env.ASK_BLOOP_FALLBACK_API_KEY,
  },
  fetch,
  // Only the intent's name, the latency and the outcome: never the transcript or the key.
  (entry) => console.log(JSON.stringify(entry)),
);

const askIntent = { fetch: handler };
export default askIntent;
