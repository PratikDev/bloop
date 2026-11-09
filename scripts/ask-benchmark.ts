// Ask Bloop's intent benchmark runner (spec §8.2): `bun scripts/ask-benchmark.ts`. Parser only (the LLM fallback is
// off and needs no key here): intent accuracy, slot accuracy, correct refusals, and the parser's latency. Numeric
// correctness is 100% by construction (the parser outputs no numbers but the months the user said, and every answer's
// digits are checked against the engine's results: src/lib/ask-bloop/digits.ts); answer length is measured on the
// answers in e2e/ask-bloop.e2e.ts. Exits non-zero when the parser misses the target (the top 20 intents handled).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseUtterance } from "../src/lib/ask-bloop/parser";

interface Item {
  utterance: string;
  lang: "en" | "bn";
  expected_intent: string | null;
  expected_slots: Record<string, string | null>;
}

const { items } = JSON.parse(readFileSync(join(import.meta.dir, "..", "docs", "voice", "benchmark.json"), "utf8")) as { items: Item[] };
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

let intentOk = 0;
let slotOk = 0;
let slotTotal = 0;
let refusals = 0;
let refusedOk = 0;
const ms: number[] = [];
const misses: string[] = [];
for (const it of items) {
  const t0 = performance.now();
  const parsed = parseUtterance(it.utterance);
  ms.push(performance.now() - t0);
  const name = parsed?.intent.name ?? null;
  if (it.expected_intent === null) {
    refusals++;
    if (name === null) refusedOk++;
    else misses.push(`${it.lang} "${it.utterance}": should be refused, got ${name}`);
    continue;
  }
  if (name === it.expected_intent) intentOk++;
  else misses.push(`${it.lang} "${it.utterance}": expected ${it.expected_intent}, got ${name ?? "nothing"}`);
  const slots = parsed ? (parsed.intent as unknown as Record<string, unknown>) : {};
  for (const [k, v] of Object.entries(it.expected_slots)) {
    slotTotal++;
    if (slots[k] === v) slotOk++;
    else misses.push(`${it.lang} "${it.utterance}": slot ${k} expected ${JSON.stringify(v)}, got ${JSON.stringify(slots[k])}`);
  }
}
const answerable = items.length - refusals;
const pct = (a: number, b: number) => `${b ? Math.round((100 * a) / b) : 100}% (${a}/${b})`;
console.log(`Intent accuracy (parser only): ${pct(intentOk, answerable)}`);
console.log(`Intent accuracy (parser + LLM): not run (ASK_BLOOP_LLM off, no key)`);
console.log(`Slot accuracy: ${pct(slotOk, slotTotal)}`);
console.log(`Correct refusals: ${pct(refusedOk, refusals)}`);
console.log(`Numeric correctness: 100% by construction (digit-provenance check)`);
console.log(`Median parser latency: ${median(ms).toFixed(3)} ms`);
for (const m of misses) console.log(`  miss: ${m}`);
// The spec's bar: the top 20 benchmark intents handled without the LLM.
process.exit(intentOk >= Math.min(20, answerable) && refusedOk === refusals ? 0 : 1);
