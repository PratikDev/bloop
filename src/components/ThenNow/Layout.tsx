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
export function PartLayout({
  finding,
  side,
  sideTitle,
  details,
  detailsTitle,
  stage,
}: {
  finding: ReactNode;
  side: ReactNode;
  sideTitle: string;
  details: ReactNode;
  detailsTitle: string;
  /** The city globe: under the side card, in whatever height the finding leaves it (it never makes the row taller or the chart narrower). */
  stage?: ReactNode;
}) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-3 lg:short:space-y-2">{finding}</div>
      {/* Narrow screens: below the chart it plays; wide screens: beside it. */}
      <aside aria-label={sideTitle} className="space-y-3 lg:flex lg:flex-col lg:self-stretch lg:short:space-y-2">
        <h3 className="eyebrow lg:short:sr-only">{sideTitle}</h3>
        {side}
        <div aria-hidden="true" className="stitch-x opacity-50" />
        <DetailsSheet title={detailsTitle}>{details}</DetailsSheet>
        {stage && <div className="mx-auto aspect-square w-full max-w-56 lg:relative lg:aspect-auto lg:max-w-none lg:min-h-0 lg:flex-1">{stage}</div>}
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
