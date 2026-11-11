"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { formatInteger } from "@/lib/i18n";
import type { Provenance } from "@/lib/provenance/types";
import { useAppState } from "../../AppState/use-app-state";
import { HowWeGotThis } from "../../HowWeGotThis";
import { InfoSheet } from "../../InfoSheet";
import { ROW_KEY } from "../../row-key";

/**
 * One track on the back of the sleeve: what was checked, the one number that says how well (from the data files),
 * a line of context, and the full wording one click away, right under the text. No box: spacing and a thin rule.
 */
export function Tile({
  number,
  title,
  figure,
  figureLabel,
  context,
  note,
  face,
  facts,
  open,
  children,
}: {
  /** Its place in the track list (a card outside the numbered checks has none). */
  number?: number;
  title: string;
  /** Left out while the data loads, or when the file has no number to show. */
  figure?: string;
  figureLabel: string;
  /** What the number means, from the data's own sentences (left out when the data doesn't say). */
  context?: string;
  /** A status beside the title (e.g. "Early preview"). */
  note?: ReactNode;
  /** The evidence on the card itself: a plot or table, key numbers, a plain explanation. */
  face?: ReactNode;
  /** Where the card's numbers come from. */
  facts?: Provenance[];
  /** The button text that opens the full content: unique on the page, so it is the link's whole name. */
  open: string;
  children: ReactNode;
}) {
  const { state } = useAppState();
  return (
    <li className="min-w-0 space-y-2 border-t-2 border-navy pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-baseline gap-3 text-body font-semibold">
          {number !== undefined && (
            <span aria-hidden="true" className="readout-figure text-lead">
              {formatInteger(number, state.lang)}
            </span>
          )}
          {title}
        </h2>
        {note}
      </div>
      <div className="max-w-[60ch] space-y-1">
        {/* The number and what it measures side by side, so each track takes fewer lines. */}
        <p className="flex items-baseline gap-3">
          {figure !== undefined && <span className="readout-figure shrink-0 text-headline leading-none text-moon">{figure}</span>}
          <span className="text-body text-haze">{figureLabel}</span>
        </p>
        {context && <p className="text-body text-moon">{context}</p>}
      </div>
      {face}
      <div className="flex flex-wrap items-center gap-3">
        <InfoSheet
          title={title}
          triggerClassName={ROW_KEY}
          trigger={
            <>
              {open}
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          }
        >
          {children}
        </InfoSheet>
        {facts && <HowWeGotThis facts={facts} />}
      </div>
    </li>
  );
}
