"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CARD = "gap-4 bg-dusk text-body text-moon ring-tide";

/**
 * One part of Then vs Now, the same shape for every part: the finding (its
 * caption as the headline, then the chart) beside a side card (how to listen,
 * or which place), with the details folded away underneath.
 */
export function PartLayout({ finding, side, sideTitle, folds }: { finding: ReactNode; side: ReactNode; sideTitle: string; folds: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Card className={CARD}>
          <CardContent className="space-y-4">{finding}</CardContent>
        </Card>
        {/* Narrow screens: how to listen comes first (this is a sound app); wide screens: beside the finding. */}
        <Card className={cn(CARD, "-order-1 lg:sticky lg:top-4 lg:order-0")}>
          <CardHeader>
            <CardTitle className="text-lead font-semibold">{sideTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">{side}</CardContent>
        </Card>
      </div>
      <div className="space-y-3">{folds}</div>
    </div>
  );
}

/** A section that opens on demand: one click (or Enter) away, never in the way. */
export function Fold({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-tide bg-night">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-2 text-body font-medium text-moon hover:bg-dusk [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-haze transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="space-y-3 px-4 pt-1 pb-4 text-body">{children}</div>
    </details>
  );
}
