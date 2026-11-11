"use client";

import { useMemo } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { thenNowProvenance, type ThenNowContext } from "@/lib/provenance/then-now";
import type { Provenance } from "@/lib/provenance/types";
import { useAppState, useT } from "../AppState/use-app-state";
import { isFieldPart, type ViewPart } from "./parts";

export function usePartProvenance(data: Omit<ThenNowContext, "t" | "lang" | "freshness"> | null, part: ViewPart): Provenance[] {
  const t = useT();
  const { state } = useAppState();
  const freshness = useFreshness();
  return useMemo(
    () => (data && !isFieldPart(part) ? [thenNowProvenance({ ...data, t, lang: state.lang, freshness }, part)] : []),
    [data, part, t, state.lang, freshness],
  );
}
