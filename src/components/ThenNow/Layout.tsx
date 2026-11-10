"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretDown, ListMagnifyingGlass } from "@phosphor-icons/react";
import { useT } from "../AppState/use-app-state";
import { useMoreSlot } from "../Dock/more-slot";
import { InfoSheet } from "../InfoSheet";
import { ROW_KEY } from "../row-key";

/** Where a part's own controls go: the row with the place and part pickers. */
export const PartActionsSlot = createContext<HTMLElement | null>(null);

/**
 * One part of Then vs Now, the same shape for every part: the finding fills the window, the part's Play and Details
 * join the row above it, and the other ways to listen go in the player's More.
 */
export function PartLayout({
  finding,
  stage,
  actions,
  more,
  details,
  detailsTitle,
}: {
  finding: ReactNode;
  /** The city globe, beside the finding from 1024 px, in whatever height the finding gives it (never narrowing the chart). */
  stage?: ReactNode;
  actions: ReactNode;
  more?: ReactNode;
  details: ReactNode;
  detailsTitle: string;
}) {
  const row = useContext(PartActionsSlot);
  const menu = useMoreSlot();
  return (
    <>
      <div className={stage ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] xl:grid-cols-[minmax(0,1fr)_15rem]" : undefined}>
        <div className="min-w-0 space-y-4">{finding}</div>
        {stage && <div className="relative -order-1 mx-auto aspect-5/6 w-full max-w-56 lg:order-none lg:aspect-auto lg:max-w-none lg:min-h-52">{stage}</div>}
      </div>
      {row &&
        createPortal(
          <>
            {actions}
            <DetailsSheet title={detailsTitle}>{details}</DetailsSheet>
          </>,
          row,
        )}
      {menu && more && createPortal(more, menu)}
    </>
  );
}

/** "Details": the sources, windows, data tables and honesty notes, in a drawer (a dialog, so screen readers reach the tables). */
function DetailsSheet({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <InfoSheet
      title={title}
      triggerClassName={ROW_KEY}
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
