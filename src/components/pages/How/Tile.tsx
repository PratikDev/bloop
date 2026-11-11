"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { RISE } from "@/lib/motion";
import { InfoSheet } from "../../InfoSheet";
import type { Provenance } from "@/lib/provenance/types";
import { HowWeGotThis } from "../../HowWeGotThis";

/**
 * One check at a glance: what was checked, the one number that says how well
 * (from the data files), and the full wording one click away.
 */
export function Tile({
  title,
  figure,
  figureLabel,
  note,
  face,
  open,
  facts,
  children,
}: {
  title: string;
  /** Left out while the data loads, or when the file has no number to show. */
  figure?: string;
  figureLabel: string;
  note?: ReactNode;
  face?: ReactNode;
  /** The button text that opens the full content. */
  open: string;
  facts: readonly Provenance[];
  children: ReactNode;
}) {
  return (
    <motion.article variants={RISE} data-provenance-group="" className="surface-plate group relative flex min-h-0 flex-col gap-2 overflow-hidden rounded-plate p-5 md:p-6">
      <span aria-hidden="true" className="stitch-x absolute inset-x-5 top-0 opacity-60" />
      <h2 className="eyebrow">{title}</h2>
      {figure !== undefined && <p className="font-serif text-headline leading-none tabular-nums text-moon">{figure}</p>}
      <p className="text-body text-haze">{figureLabel}</p>
      {note}
      {face}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <InfoSheet
          title={title}
          triggerLabel={`${open}: ${title}`}
          triggerClassName="-ml-3 h-11 gap-2 rounded-full px-3 text-body text-moon hover:bg-tide"
          trigger={
            <>
              {open}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          }
        >
          {children}
        </InfoSheet>
        <HowWeGotThis facts={facts} />
      </div>
    </motion.article>
  );
}
