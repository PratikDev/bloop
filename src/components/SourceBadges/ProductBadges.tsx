"use client";

import { useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { useAppState, useT } from "../AppState/use-app-state";
import { SourceBadges } from ".";

/** The badges for one meta/freshness.json product, in the app's own language table (panels). */
export function ProductBadges({ product, className }: { product: string | undefined; className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const freshness = useFreshness();
  const [now] = useState(Date.now);
  if (!product) return null;
  return <SourceBadges entry={freshness?.products[product]} now={now} tr={t} lang={state.lang} className={className} />;
}
