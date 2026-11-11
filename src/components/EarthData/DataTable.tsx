"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly ReactNode[])[];
  rowKeys?: readonly string[];
  current?: number | null;
  currentLabel?: string;
  className?: string;
  testId?: string;
}

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
