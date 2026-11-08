"use client";

import { describeRecord, spokenDescription } from "@/lib/describe/compose";
import type { BoundT, Lang } from "@/lib/i18n";
import type { Verbosity } from "../AppState/access";
import { useAppState } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import type { FactsFor } from "./describe-now";
import { describeNow } from "./describe-now";
import { useDescribeInput } from "./use-description";

/** Every record's description as one spoken text, in a language. */
export function spokenFor(facts: FactsFor, verbosity: Verbosity, t: BoundT, lang: Lang): string {
  return facts(lang)
    .map((f) => spokenDescription(describeRecord(f, verbosity, lang), t))
    .join(" ");
}

/**
 * D ("describe here", spec 3.2): says the description of the needle once, at the chosen detail, through the speech
 * mode (the status region or Bloop's voice, never both). Never continuous: Describe mode (Shift+D) keeps that job.
 * Null while there is nothing to describe (the frames are still loading, or a time-lapse is playing).
 */
export function useDescribeHere(): (() => void) | null {
  const { state } = useAppState();
  const commands = useCommands();
  const input = useDescribeInput();
  if (!input) return null;
  return () => {
    void describeNow(input).then((facts) => commands.say((t, lang) => spokenFor(facts, state.verbosity, t, lang)));
  };
}
