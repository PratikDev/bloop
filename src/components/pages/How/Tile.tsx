"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { RISE } from "@/lib/motion";
import { InfoSheet } from "../../InfoSheet";

/**
 * One check at a glance: what was checked, the one number that says how well
 * (from the data files), and the full wording one click away.
 */
export function Tile({
  title,
  figure,
  figureLabel,
  note,
  open,
  children,
}: {
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
  return (
    <motion.article variants={RISE} className="surface-plate group relative flex min-h-0 flex-col gap-2 overflow-hidden rounded-plate p-5 md:p-6">
      <span aria-hidden="true" className="stitch-x absolute inset-x-5 top-0 opacity-60" />
      <h2 className="eyebrow">{title}</h2>
      {figure !== undefined && <p className="font-serif text-headline leading-none tabular-nums text-moon">{figure}</p>}
      <p className="text-body text-haze">{figureLabel}</p>
      {note}
      <div className="mt-auto pt-2">
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
      </div>
    </motion.article>
  );
}
