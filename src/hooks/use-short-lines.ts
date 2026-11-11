"use client";

import { useMemo } from "react";
import type { DegreeStyle } from "@/a11y/brailleText";
import { useAppState } from "@/components/AppState/use-app-state";
import { FLAGS } from "@/lib/flags";
import { useBrailleSettings } from "./use-braille-settings";

export function useShortLines(): { on: boolean; degree: DegreeStyle } {
  const { state } = useAppState();
  const [braille] = useBrailleSettings();
  const on = FLAGS.speechChoices && state.brailleLines === "short";
  return useMemo(() => ({ on, degree: braille.degree }), [on, braille.degree]);
}
