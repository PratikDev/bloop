"use client";

import { useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { voiceSpec } from "@/lib/audio/mapping";
import { ageDaysAt, livenessAt } from "@/lib/data";
import { formatFixed } from "@/lib/i18n";
import type { FreshnessEntry } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";
import { useShownPoint } from "../TimeLapse/use-shown-point";

/** The one status allowed on the surface: how old the frame is, and only once it is past its limit. */
export function StalePill() {
  const { state } = useAppState();
  const t = useT();
  const freshness = useFreshness();
  const { track } = useShownPoint();
  const [now] = useState(Date.now);
  const voices = track === "both" ? (["ocean", "rain"] as const) : track === "ocean" ? (["ocean"] as const) : (["rain"] as const);
  const stale = voices
    .map((voice) => voiceSpec(voice).source.product)
    .map((product) => (product ? freshness?.products[product] : undefined))
    .find((entry): entry is FreshnessEntry => entry !== undefined && livenessAt(entry, now) === "recorded");
  if (!stale) return null;
  return (
    <StatusBadge kind="october" className="shrink-0">
      {t("records.stale", { days: formatFixed(ageDaysAt(stale, now) ?? 0, state.lang, 1) })}
    </StatusBadge>
  );
}
