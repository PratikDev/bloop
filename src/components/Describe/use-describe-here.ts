"use client";

import { describeShort } from "@/a11y/shortForms";
import type { DegreeStyle } from "@/a11y/brailleText";
import { describeRecord, spokenDescription } from "@/lib/describe/compose";
import { categoryWord } from "@/lib/art/category-lead";
import { bindT, type BoundT, type Lang } from "@/lib/i18n";
import type { Verbosity } from "../AppState/access";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import type { DescribeInput, FactsFor } from "./describe-now";
import { describeNow } from "./describe-now";
import { useDescribeInput } from "./use-description";

const sourcesOf = (input: DescribeInput) =>
  [input.track !== "rain" && input.heldFrame === null ? input.fields.sst.meta.source_dataset : null, input.track !== "ocean" ? (input.fields.rain?.meta.source_dataset ?? null) : null].filter(
    (s) => s !== null,
  );

function spokenFor(facts: FactsFor, verbosity: Verbosity, t: BoundT, lang: Lang): string {
  return facts(lang)
    .map((f) => spokenDescription(describeRecord(f, verbosity, lang), t))
    .join(" ");
}

function shortFor(facts: FactsFor, t: BoundT, lang: Lang, degree: DegreeStyle): string {
  const records = facts(lang);
  const short = describeShort(t, lang, degree, records.map((f) => ({ record: f.record, value: f.value, frozen: f.frozen, at: f.here, timeUtc: f.timeUtc })));
  return [records.length === 1 ? categoryWord(t, records[0].record) : "", short].filter(Boolean).join(" ");
}

export function useDescribeHere(): (() => void) | null {
  const { state } = useAppState();
  const commands = useCommands();
  const input = useDescribeInput();
  if (!input) return null;
  return () => {
    void describeNow(input).then((facts) => {
      void commands.say((t, lang) => spokenFor(facts, state.verbosity, t, lang), null, (t, lang, degree) => shortFor(facts, t, lang, degree));
      commands.note(spokenFor(facts, state.verbosity, bindT(state.lang), state.lang), sourcesOf(input));
    });
  };
}
