"use client";

import type { ReactNode } from "react";
import { CaretDown, ListMagnifyingGlass } from "@phosphor-icons/react";
import { useT } from "../AppState/use-app-state";
import { InfoSheet } from "../InfoSheet";

/**
 * One part of Then vs Now, the same shape for every part: the finding (its
 * caption as the headline, then the chart) beside a side card (how to listen,
 * or which place). The details open in a sheet, so the page never grows.
 */
export function PartLayout({ finding, side, sideTitle, details, detailsTitle }: { finding: ReactNode; side: ReactNode; sideTitle: string; details: ReactNode; detailsTitle: string }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="surface-plate space-y-3 rounded-plate p-4 md:p-5 lg:short:space-y-2 lg:short:p-4">{finding}</div>
      {/* Narrow screens: how to listen comes first (this is a sound app); wide screens: beside the finding. */}
      <aside aria-label={sideTitle} className="surface-plate -order-1 space-y-3 rounded-plate p-4 lg:order-0 lg:short:space-y-2">
        <h3 className="eyebrow lg:short:sr-only">{sideTitle}</h3>
        {side}
        <div aria-hidden="true" className="stitch-x opacity-50" />
        <DetailsSheet title={detailsTitle}>{details}</DetailsSheet>
      </aside>
    </div>
  );
}

/** "Details": the sources, windows and honesty notes, one click away in a sheet. */
function DetailsSheet({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <InfoSheet
      title={title}
      triggerClassName="h-11 w-full justify-start gap-2 rounded-lg px-3 text-body text-haze hover:bg-tide hover:text-moon lg:pointer-fine:h-9"
      trigger={
        <>
          <ListMagnifyingGlass aria-hidden="true" className="size-5" />
          {t("thenNow.details")}
        </>
      }
    >
      {children}
    </InfoSheet>
  );
}

/** A section that opens on demand: one click (or Enter) away, never in the way. */
export function Fold({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-lg bg-night/60 ring-1 ring-glass-edge">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-2 text-body font-medium text-moon hover:bg-tide/60 [&::-webkit-details-marker]:hidden">
        {title}
        <CaretDown aria-hidden="true" className="size-4 shrink-0 text-haze transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-4 pt-1 pb-4 text-body">{children}</div>
    </details>
  );
}
