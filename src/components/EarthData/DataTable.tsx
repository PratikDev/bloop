"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  caption: string;
  columns: readonly string[];
  /** Each row's cells; the first is the row's header (th scope="row"), so a screen reader names every cell by it. */
  rows: readonly (readonly ReactNode[])[];
  /** Keys for the rows (else their index). */
  rowKeys?: readonly string[];
  /** Marks one row (the needle's, the day playing): bold, outlined, and said ("now"). */
  current?: number | null;
  currentLabel?: string;
  className?: string;
  testId?: string;
}

/**
 * A real table for the DATA views (Data health, the records' "View as table"): a caption, column headers, row headers.
 * It scrolls inside a region that takes focus, so a keyboard can reach and scroll it (axe: scrollable-region-focusable);
 * a screen reader's table keys move cell by cell.
 */
export function DataTable({ caption, columns, rows, rowKeys, current = null, currentLabel, className, testId }: DataTableProps) {
  return (
    <div role="region" aria-label={caption} tabIndex={0} className={cn("overflow-auto rounded-lg ring-1 ring-glass-edge focus-visible:ring-2 focus-visible:ring-shapla", className)} data-testid={testId}>
      <table className="w-full border-collapse text-left text-small tabular-nums">
        <caption className="px-2 pt-2 pb-1 text-left text-small text-haze">{caption}</caption>
        <thead className="sticky top-0 bg-popover text-haze">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-2 py-1 font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const now = i === current;
            return (
              <tr key={rowKeys?.[i] ?? i} className={cn("border-t border-glass-edge", now && "font-semibold text-moon ring-2 ring-shapla ring-inset")} aria-current={now ? "true" : undefined}>
                {r.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-2 py-1 font-normal">
                      {cell}
                      {now && currentLabel && <span className="sr-only">, {currentLabel}</span>}
                    </th>
                  ) : (
                    <td key={j} className="px-2 py-1">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
