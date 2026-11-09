"use client";

import { useFreshness } from "@/hooks/use-freshness";
import { creditLines } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useT } from "./AppState/use-app-state";

/** One credit line per published source (book §13.3 wording), read from meta/freshness.json. Attribution stays English. */
export function ProductCredits({ className }: { className?: string }) {
  const t = useT();
  const freshness = useFreshness();
  if (!freshness) return null;
  return (
    <section lang="en" className={cn("space-y-1", className)}>
      <h3 className="text-body font-medium text-moon">{t("credits.products")}</h3>
      <ul className="list-disc space-y-0.5 pl-5 text-small text-haze">
        {creditLines(freshness).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
