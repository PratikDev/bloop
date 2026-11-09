"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { formatInteger } from "@/lib/i18n";
import { useAppState } from "../../AppState/use-app-state";
import { InfoSheet } from "../../InfoSheet";

/**
 * One track on the back of the sleeve: what was checked, the one number that says how well
 * (from the data files), and the full wording one click away.
 */
export function Tile({
  number,
  title,
  figure,
  figureLabel,
  note,
  open,
  children,
}: {
  /** Its place in the track list. */
  number: number;
  title: string;
  /** Left out while the data loads, or when the file has no number to show. */
  figure?: string;
  figureLabel: string;
  /** A status line under the number (e.g. "Coming in October"). */
  note?: ReactNode;
  /** The button text that opens the full content. */
  open: string;
  children: ReactNode;
}) {
  const { state } = useAppState();
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <span aria-hidden="true" className="readout-figure text-title">
        {formatInteger(number, state.lang)}
      </span>
      <div className="min-w-0 space-y-1">
        <h2 className="eyebrow">{title}</h2>
        {figure !== undefined && <p className="readout-figure text-title leading-tight text-moon">{figure}</p>}
        <p className="text-body text-haze">{figureLabel}</p>
        {note}
      </div>
      <div className="col-start-2 sm:col-start-3">
        <InfoSheet
          title={title}
          triggerLabel={`${open}: ${title}`}
          triggerClassName="key h-11 gap-2 rounded-lg bg-paper px-3 text-body font-normal text-moon hover:bg-paper"
          trigger={
            <>
              {open}
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          }
        >
          {children}
        </InfoSheet>
      </div>
    </li>
  );
}
