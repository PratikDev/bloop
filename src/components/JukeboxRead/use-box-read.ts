"use client";

import { useMemo } from "react";
import { useCvView } from "@/hooks/use-cv-view";
import type { LatLon } from "@/lib/data";
import { boundsOf, NAMED_BOXES, NEEDLE_BOX, type Bounds } from "@/lib/cv/boxes";
import { boxStats, type BoxStats } from "@/lib/cv/boxes";
import { budgetFor, liveBudget, type LiveBudget } from "@/lib/cv/error-budget";
import type { ReadSource } from "@/lib/cv/read-source";
import { useT } from "../AppState/use-app-state";

export interface BoxRead {
  boxId: string;
  boxName: string;
  bounds: Bounds;
  stats: BoxStats | null;
  pitch: boolean;
  budget: LiveBudget | null;
}

export function useBoxRead(source: ReadSource | null, needle: LatLon): BoxRead {
  const t = useT();
  const [view] = useCvView();
  const bounds = useMemo(() => boundsOf(view.box, needle), [view.box, needle]);
  const stats = useMemo(() => (source && source.trust !== "pattern" ? boxStats(source.grid, bounds, source.axis) : null), [source, bounds]);
  const axis = source?.pitchVoice ? budgetFor(source.recordId) : null;
  const budget = useMemo(() => (axis ? liveBudget(axis) : null), [axis]);
  const named = NAMED_BOXES.find((b) => b.id === view.box);
  return { pitch: Boolean(source?.pitchVoice), boxId: named ? named.id : NEEDLE_BOX, boxName: named ? t("cv.box.name", { id: named.id }) : t("cv.box.needle"), bounds, stats, budget };
}
