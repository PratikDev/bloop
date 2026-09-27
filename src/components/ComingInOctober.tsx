"use client";

import type { MessageKey } from "@/lib/i18n";
import { useT } from "./AppState/use-app-state";
import { StatusBadge } from "./StatusBadge";

/** Team plan §11.7 concept-only items, plus X-ray (waiting for L1's colorbar data, C1). */
const ITEMS: MessageKey[] = [
  "october.xray",
  "october.aiByEar",
  "october.study",
  "october.choirs",
  "october.passes",
  "october.raga",
  "october.duets",
  "october.tracks",
  "october.kiosk",
];

/** What isn't built yet, each item labelled, so nothing looks finished that isn't. */
export function ComingInOctober() {
  const t = useT();
  return (
    <section aria-labelledby="october-heading" className="space-y-2 border-t border-tide pt-4">
      <h3 id="october-heading" className="text-lead font-medium">
        {t("october.heading")}
      </h3>
      <ul className="space-y-1.5 text-body">
        {ITEMS.map((key) => (
          <li key={key} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t(key)}</span>
            <StatusBadge kind="october">{t("badge.comingOctober")}</StatusBadge>
          </li>
        ))}
      </ul>
    </section>
  );
}
