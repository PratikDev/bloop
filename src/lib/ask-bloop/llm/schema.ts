// The registry as the LLM fallback sees it (spec §5.4): one function per intent, its slots as JSON Schema with the
// registry's own value lists. Nothing here carries a number or a coordinate; places are words resolvePlace() maps.
import { SPEECH_MODES, VERBOSITIES } from "@/components/AppState/access";
import { LANGS } from "@/lib/i18n/types";
import { ASK_PAGES, ASK_RECORDS, EXTREMES, FRAME_STEPS, type IntentName } from "../intents";
import { INTENT_NAMES } from "../registry";
import { SLOTS } from "../validate";

type JsonSchema = { type: "string" | "null" | "object"; enum?: readonly string[]; pattern?: string; description?: string } | { anyOf: JsonSchema[] };

const PLACE: JsonSchema = { type: "string", description: "The place's name as the user said it (never coordinates or numbers)" };
const MONTH: JsonSchema = { type: "string", pattern: "^\d{4}-(0[1-9]|1[0-2])$", description: "A month the user named, YYYY-MM" };
const orNull = (s: JsonSchema): JsonSchema => ({ anyOf: [s, { type: "null" }] });

/** Each slot's schema (a slot name means the same in every intent that has it). */
const SLOT_SCHEMA: Record<string, JsonSchema> = {
  record: { type: "string", enum: ASK_RECORDS },
  place: PLACE,
  step: { type: "string", enum: FRAME_STEPS },
  page: { type: "string", enum: ASK_PAGES },
  setting: { type: "string", enum: ["verbosity", "speech_output", "input_language"] },
  value: { type: "string", enum: [...VERBOSITIES, ...SPEECH_MODES, ...LANGS] },
  kind: { type: "string", enum: EXTREMES },
  dateA: MONTH,
  dateB: MONTH,
};
/** Slots that may be null (no place = here; no record = the one playing). */
const NULLABLE: Partial<Record<IntentName, readonly string[]>> = { extreme_in: ["place"], compare_dates: ["place"], about_record: ["record"] };

export interface ToolSpec {
  type: "function";
  function: { name: IntentName; description: string; parameters: { type: "object"; properties: Record<string, JsonSchema>; required: string[]; additionalProperties: false } };
}

/** The tools for an OpenAI-compatible chat-completions request: one per registry intent. */
export function intentTools(describe: (name: IntentName) => string): ToolSpec[] {
  return INTENT_NAMES.map((name) => ({
    type: "function",
    function: {
      name,
      description: describe(name),
      parameters: {
        type: "object",
        properties: Object.fromEntries(SLOTS[name].map((slot) => [slot, NULLABLE[name]?.includes(slot) ? orNull(SLOT_SCHEMA[slot]) : SLOT_SCHEMA[slot]])),
        required: [...SLOTS[name]],
        additionalProperties: false,
      },
    },
  }));
}
