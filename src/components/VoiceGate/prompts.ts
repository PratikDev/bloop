// The gate test's prompts: 20 per language from the registry's own examples (the first of each intent but
// the last), each with the intent and slots the parser makes of the prompt itself, so a transcript is scored on
// meaning, not on spelling. Bangla prompts are drafts until a Bangla speaker checks them.
import type { Intent } from "@/lib/ask-bloop/intents";
import { parseUtterance } from "@/lib/ask-bloop/parser";
import { INTENT_NAMES, REGISTRY } from "@/lib/ask-bloop/registry";
import type { Lang } from "@/lib/i18n/types";

const PROMPTS_PER_LANG = 20;

export interface Prompt {
  text: string;
  expected: Intent;
}

export function prompts(lang: Lang): Prompt[] {
  return INTENT_NAMES.slice(0, PROMPTS_PER_LANG).flatMap((name) => {
    const text = REGISTRY[name].examples[lang][0];
    const expected = parseUtterance(text)?.intent;
    return expected ? [{ text, expected }] : [];
  });
}

/** A transcript scores when the parser makes the same intent and slots of it (place words compared without case). */
export function scores(transcript: string, expected: Intent): { parsed: Intent | null; correct: boolean } {
  const parsed = parseUtterance(transcript)?.intent ?? null;
  const norm = (i: Intent) => JSON.stringify(i).toLowerCase();
  return { parsed, correct: parsed !== null && norm(parsed) === norm(expected) };
}
