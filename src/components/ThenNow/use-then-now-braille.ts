"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { isLetter, isTypingTarget } from "@/a11y/keys";
import type { ClimateCellName, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";
import { isFieldPart, type ViewPart } from "./parts";

interface BrailleSource {
  ready: { grace: GraceContextFile; stats: ThenNowStatsFile | null } | null;
  demo: DhakaThenNowDemo | null;
  part: ViewPart;
  cityName: ClimateCellName;
  stop: () => void;
}

export function useThenNowBraille({ ready, demo, part, cityName, stop }: BrailleSource) {
  const [brailleOpen, setBrailleOpen] = useState(false);
  const brailleInput = useMemo(
    () => (ready && demo && !isFieldPart(part) ? { part, cityName, demo, grace: ready.grace, stats: ready.stats ?? null } : null),
    [ready, demo, part, cityName],
  );
  const openBraille = (open: boolean) => {
    if (open) stop();
    setBrailleOpen(open);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (isFieldPart(part) || !isLetter(e, "b") || isTypingTarget(e.target)) return;
    e.preventDefault();
    openBraille(!brailleOpen);
  };
  return { brailleOpen, brailleInput, openBraille, onKeyDown };
}
