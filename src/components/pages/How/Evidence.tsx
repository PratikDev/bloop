"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "../../AppState/use-app-state";

export interface EvidenceTable {
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
}

/**
 * A card's evidence: the plot with its alt text, and a "View as table" button that shows the same
 * numbers as a real table, for screen readers and anyone who prefers rows to dots.
 */
export function Evidence({ alt, table, children }: { alt: string; table: EvidenceTable; children?: ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(!children);
  const id = useId();
  return (
    <figure className="space-y-2" data-testid="evidence">
      {children && (
        <div role="img" aria-label={alt} data-testid="evidence-plot">
          <div aria-hidden="true">{children}</div>
        </div>
      )}
      {children && (
        <Button variant="ghost" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="-ml-3 h-11 rounded-full px-3 text-body text-moon hover:bg-tide">
          {t(open ? "how.hideTable" : "how.viewTable")}
        </Button>
      )}
      {/* It scrolls, so the keyboard can reach it (axe: scrollable-region-focusable); named by the table's caption. */}
      <div id={id} hidden={!open} tabIndex={0} role="region" aria-label={table.caption} className="max-h-56 overflow-auto rounded-lg border border-tide">
        <table className="w-full text-left text-small tabular-nums" data-testid="evidence-table">
          <caption className="sr-only">{table.caption}</caption>
          <thead className="sticky top-0 bg-popover text-haze">
            <tr>
              {table.columns.map((c) => (
                <th key={c} scope="col" className="px-2 py-1 font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="border-t border-tide">
                {r.map((cell, j) => (
                  <td key={j} className="px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
