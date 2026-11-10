"use client";

import { useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { livenessAt } from "@/lib/data";
import { formatDay } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { SourceBadges } from "../SourceBadges";
import { StatusBadge } from "../StatusBadge";

/**
 * A product's data age (meta/freshness.json, recomputed now): its badges, and past its freshness limit a plain line,
 * "Data from <date>; may be out of date", shown and read (P1–P4: every DATA product shows its age).
 */
export function AgeNote({ product, sourceTime }: { product: string; sourceTime: string | null }) {
  const t = useT();
  const { state } = useAppState();
  const freshness = useFreshness();
  const [now] = useState(() => Date.now());
  const entry = freshness?.products[product];
  const stale = entry ? livenessAt(entry, now) === "recorded" : false;
  const date = sourceTime ? formatDay(sourceTime.slice(0, 10), state.lang) : null;
  return (
    <div className="flex flex-col items-start gap-1" data-age-product={product} data-stale={stale ? "true" : "false"}>
      <SourceBadges entry={entry} now={now} tr={t} lang={state.lang} />
      {date && (stale ? <StatusBadge kind="note">{t("earth.age.stale", { date })}</StatusBadge> : <span className="text-small text-haze">{t("earth.age.from", { date })}</span>)}
    </div>
  );
}
