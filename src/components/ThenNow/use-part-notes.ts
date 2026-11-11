"use client";

import { useCallback } from "react";
import { bi, type BiText } from "@/lib/bi-text";
import { statTexts } from "@/lib/then-now-stats";
import type { ClimateCellName } from "@/types/data-contract";
import type { ViewPart } from "./parts";
import type { useThenNowData } from "./use-then-now-data";
import type { Part } from "./use-then-now-player";

type Ready = Extract<ReturnType<typeof useThenNowData>, { status: "ready" }>;
export type CityRecord = NonNullable<Ready["cities"]>["cities"][number];

export function usePartNotes(ready: Ready | null, city: CityRecord | null, cityName: ClimateCellName) {
  const sharedFor = useCallback(
    (p: ViewPart): ClimateCellName[] => {
      const cell = p === "heat" ? city?.heat : p === "monsoon" ? city?.rain.gpcp : null;
      return cell && cell.same_record_as === null ? cell.shares_cell_with : [];
    },
    [city],
  );
  const stats = ready?.stats ?? null;
  const statLines = useCallback((p: Part) => (stats ? statTexts(stats, cityName, p) : null), [stats, cityName]);
  const deg = ready?.grace.mascon_deg ?? null;
  const noteLines = useCallback(
    (p: Part): BiText[] => {
      const shared = sharedFor(p);
      return [
        ...(p === "water" ? [bi((tl) => tl("water.bangladeshWide", { deg }))] : []),
        ...(shared.length ? [bi((tl) => tl("history.sharedCell", { places: shared.map((c) => tl(`place.${c}`)).join(", ") }))] : []),
      ];
    },
    [sharedFor, deg],
  );
  return { sharedFor, statLines, noteLines };
}
